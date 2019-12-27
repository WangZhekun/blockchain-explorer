/**
 *    SPDX-License-Identifier: Apache-2.0
 */
var ledgerMgr = require("./ledgerMgr"); // node事件触发器实例

var PlatformBuilder = require("../../platform/PlatformBuilder.js"); // Platform实例的工厂，Platform实例主要是对fabric的访问的封装，

var requtil = require("./requestutils"); // 对HTTP请求的处理工具
var helper = require('../../helper.js')
var chs = require("../../explorer/rest/logical/channelService.js"); // 创建channel服务
var logger = helper.getLogger("main");


/**
 * 给Explorer应用定义访问区块链平台的reset请求
 * @param {Object} app Explorer应用实例
 * @param {string} pltfrm 区块链平台名称
 * @param {Object} persistance 数据库服务
 */
const platformroutes = async function (app, pltfrm, persistance) {

  // 定义全局的platform、proxy、statusMetrics、crudService TODO：优化
  platform = await PlatformBuilder.build(pltfrm); // 创建指定区块链平台的Platform实例
  proxy = platform.getDefaultProxy(); // 获取默认的组织和peer的Proxy实例
  statusMetrics = persistance.getMetricService(); // 数据库统计数据服务
  crudService = persistance.getCrudService(); // 数据库数据持久化服务

  /***
      Block by number 获取指定channel的指定编号的区块
      GET /api/block/getinfo -> /api/block
      curl -i 'http://<host>:<port>/api/block/<channel>/<number>'
      *
      */
  app.get("/api/block/:channel/:number", function (req, res) {
    let number = parseInt(req.params.number);
    let channelName = req.params.channel;
    if (!isNaN(number) && channelName) {
      proxy.getBlockByNumber(channelName, number).then(block => {
        res.send({
          status: 200,
          number: block.header.number.toString(),
          previous_hash: block.header.previous_hash,
          data_hash: block.header.data_hash,
          transactions: block.data.data
        });
      });
    } else {
      return requtil.invalidRequest(req, res);
    }
  });

  /**
      Return list of channels 获取默认peer加入的所有channel名
      GET /channellist -> /api/channels
      curl -i http://<host>:<port>/api/channels
      Response:
      {
      "channels": [
          {
          "channel_id": "mychannel"
          }
      ]
      }
      */
  app.get("/api/channels", function (req, res) {
    var channels = [],
      counter = 0;
    var channels = platform.getChannels(); // 获取默认peer加入的所有channel名

    var response = {
      status: 200
    };
    response["channels"] = [...new Set(channels)];
    res.send(response);
  });

  /**
  Return current channel 获取默认channel
  GET /api/curChannel
  curl -i 'http://<host>:<port>/api/curChannel'
  */
  app.get("/api/curChannel", function (req, res) {
    res.send({
      currentChannel: proxy.getDefaultChannel()
    });
  });

  /**
  Return change channel 修改默认channel名
  POST /api/changeChannel
  curl -i 'http://<host>:<port>/api/curChannel'
  */
  app.get("/api/changeChannel/:channelName", function (req, res) {
    let channelName = req.params.channelName;
    proxy.changeChannel(channelName); // 修改默认channel名
    ledgerMgr.ledgerEvent.emit("changeLedger"); // 触发changeLedger事件 TODO：该事件没有监听
    res.send({
      currentChannel: proxy.getDefaultChannel()
    });
  });


  /***
     Read "blockchain-explorer/app/config/CREATE-CHANNEL.md" on "how to create a channel"

      The values of the profile and genesisBlock are taken fron the configtx.yaml file that
      is used by the configtxgen tool
      Example values from the defualt first network:
      profile = 'TwoOrgsChannel';
      genesisBlock = 'TwoOrgsOrdererGenesis';
  */

  /*
  Create new channel 创建channel
  POST /api/channel
  Content-Type : application/x-www-form-urlencoded
  {channelName:"newchannel02"
  genesisBlock:"TwoOrgsOrdererGenesis"
  orgName:"Org1"
  profile:"TwoOrgsChannel"}
  {fieldname: "channelArtifacts", fieldname: "channelArtifacts"}
  <input type="file" name="channelArtifacts" multiple />
  Response: {  success: true, message: "Successfully created channel "   }
  */
  app.post('/api/channel', async function (req, res) {
    try {
      // upload channel config, and org config
      let artifacts = await requtil.aSyncUpload(req, res); // 异步调用multer，对上传的文件进行处理，重新组装请求参数
      let chCreate = await chs.createChannel(artifacts, platform, crudService); // 创建channel TODO：问题：这里需要上传文件，为何还要生成tx文件？
      let channelResponse = {
        success: chCreate.success,
        message: chCreate.message
      };
      return res.send(channelResponse);

    } catch (err) {
      logger.error(err)
      let channelError = {
        success: false,
        message: "Invalid request, payload"
      }
      return res.send(channelError);
    }
  });

  /***
      An API to join channel 将指定的多个peer节点加入到指定channel
  POST /api/joinChannel

  curl -X POST -H "Content-Type: application/json" -d '{ "orgName":"Org1","channelName":"newchannel"}' http://localhost:8080/api/joinChannel

  Response: {  success: true, message: "Successfully joined peer to the channel "   }
  */
  app.post("/api/joinChannel", function (req, res) {
    var channelName = req.body.channelName;
    var peers = req.body.peers;
    var orgName = req.body.orgName;
    if (channelName && peers && orgName) {
      proxy.joinChannel(channelName, peers, orgName, platform).then(resp => { // 将指定的多个peer节点加入到指定channel
        return res.send(resp);
      });
    } else {
      return requtil.invalidRequest(req, res);
    }
  });

  /**
      Chaincode list 获取指定channel上的所有chaincode
      GET /chaincodelist -> /api/chaincode
      curl -i 'http://<host>:<port>/api/chaincode/<channel>'
      Response:
      [
        {
          "channelName": "mychannel",
          "chaincodename": "mycc",
          "path": "github.com/hyperledger/fabric/examples/chaincode/go/chaincode_example02",
          "version": "1.0",
          "txCount": 0
        }
      ]
    */
  app.get("/api/chaincode/:channel", function (req, res) {
    let channelName = req.params.channel;
    if (channelName) {
      statusMetrics.getTxPerChaincode(channelName, async function (data) { // 查询指定channel上的chaincode
        for (let chaincode of data) {
          let temp = await proxy.loadChaincodeSrc(chaincode.path); // 读取chaincode文件内容
          chaincode.source = temp;
        }
        res.send({
          status: 200,
          chaincode: data
        });
      });
    } else {
      return requtil.invalidRequest(req, res);
    }
  });

  /***
   * Peer Status List 获取指定channel上所有peer的状态 TODO：问题：这个接口不太明白？
  GET /peerlist -> /api/peersStatus
  curl -i 'http://<host>:<port>/api/peersStatus/<channel>'
  Response:
  [
    {
      "requests": "grpcs://127.0.0.1:7051",
      "server_hostname": "peer0.org1.example.com"
    }
  ]
  */
  app.get("/api/peersStatus/:channel", function (req, res) {
    let channelName = req.params.channel;
    if (channelName) {
       platform.getPeersStatus(channelName,function (data) { // 获取Admin实例的状态
        res.send({ status: 200, peers: data });
      });
    } else {
      return requtil.invalidRequest(req, res);
    }
  });
}

module.exports = platformroutes;