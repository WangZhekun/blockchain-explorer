/**
 *    SPDX-License-Identifier: Apache-2.0
 */

var path = require("path");
var helper = require("../../helper.js");
var logger = helper.getLogger("platform");
var configuration = require("./Configuration.js"); // 访问网络配置的Configuration类
var fs = require("fs-extra");
var FabricChannel = require("./FabricChannel.js"); // FabricChannel类，是channel实例、channel名称、channel EventHub的集合
var Proxy = require("./Proxy.js"); // Peer节点的访问代理
var hfc = require("fabric-client");
var Admin = require("./Admin.js"); // TODO：问题：这个模块暂时不明白
hfc.addConfigFile(path.join(__dirname, "./config.json"));

/**
 * 该类主要是对fabric的访问的封装，包含Client、Channel、Peer、Orderer等实例以及对应关系的缓存
 */
class Platform {
  constructor() {
    this.clients = {}; // 组织名到fabric-client实例的映射
    this.channels = {}; // channel名称到FabricChannel实例的映射
    this.caClients = {}; // TODO: 没有set方法
    this.peers = {}; // 组织名,peer名 到peer实例的映射
    this.peersStatus = {}; // 组织名,peer名 到Admin实例的映射
    //	Orderer Info BE-303
    this.orderers = {}; // 组织名,orderer名 到orderer实例的映射
    //Orderer Info BE-303
  }

  /**
   * 获取默认的组织和peer的Proxy实例
   */
  getDefaultProxy() {
    return this.getProxy(
      configuration.getDefaultOrg(),
      configuration.getDefaultPeer()
    );
  }

  /**
   * 获取指定组织指定peer的Proxy实例
   * @param {string} org 组织名
   * @param {string} peer peer名
   */
  getProxy(org, peer) {
    return new Proxy(
      this.getPeerObject(org, peer), // 获取指定组织指定peer的peer实例
      this.getClientForOrg(org), // 获取org组织的fabric-client实例
      this.channels // channel名称到FabricChannel实例的映射
    );
  }

  /**
   * 添加peer节点的Admin实例，用于保存状态
   * TODO：问题：为何要用Admin实例，而不用Peer实例？
   * @param {string} org 组织名
   * @param {string} key peer名
   * @param {string} url peer节点的请求地址
   * @param {Object} opts peer节点的请求对象
   */
  addStatusPeer(org, key, url, opts){
       this.peersStatus[[org, key]] = new Admin(url, opts); // 创建一个Admin对象
  }

  /**
   * 获取默认peer实例
   */
  getDefaultPeer() {
    return this.getPeerObject(
      configuration.getDefaultOrg(),
      configuration.getDefaultPeer()
    );
  }

  /**
   * 获取channel名列表
   */
  getChannels() {
    return Object.keys(this.channels);
  }

  /**
   * 获取指定组织指定peer的peer实例
   * @param {string} org 组织名
   * @param {string} peer peer名
   */
  getPeerObject(org, peer) {
    return this.peers[[org, peer]];
  }

// ====================Orderer BE-303=====================================
  /**
   * 获取指定组织指定orderer名的orderer实例
   * @param {string} org 组织名
   * @param {string} orderer orderer名
   */
  getOrdererObject(org, orderer) {
    return this.orderers[[org, orderer]]; // TODO:this.orderers没有set方法
  }
// ====================Orderer BE-303=====================================
  /**
   * 获取默认组织的fabric-client实例
   */
  getDefaultClient() {
    return this.getClientForOrg(configuration.getDefaultOrg());
  }

  /**
   * 获取指定组织的fabric-client实例
   * @param {string} org 组织名
   */
  getClientForOrg(org) {
    return this.clients[org];
  }

  /**
   * 给org组织的client添加Admin用户
   * @param {string} org 组织名
   * @param {Object} client fabric-client实例
   */
  async setAdminForClient(org, client) {
    var admin = configuration.getOrg(org).admin; // 获取org组织的admin配置对象
    var keyPath = admin.key; // admin用户的秘钥文件地址
    var keyPEM = Buffer.from(helper.readAllFiles(keyPath)[0]).toString(); // 读文件
    var certPath = admin.cert; // admin用户的证书文件地址
    var certPEM = helper.readAllFiles(certPath)[0].toString(); // 读文件
    var admin;

    try {
      admin = await client.createUser({ // 创建组织管理员的User实例
        username: "peer" + org + "Admin",
        mspid: configuration.getMspID(org),
        cryptoContent: {
          privateKeyPEM: keyPEM,
          signedCertPEM: certPEM
        },
        skipPersistence: false // 不持久保存
      });

      client.setAdminSigningIdentity( // 给组织设置管理员的签名
        keyPEM,
        certPEM,
        configuration.getMspID(org)
      );
    } catch (err) {
      console.log("error-admin--" + err.stack);
      throw err;
    }
    return admin;
  }

  /**
   * 获取Admin实例的状态
   * TODO:问题:没看明白?
   * @param {function} cb 回调函数
   */
  async getPeersStatus(channelName,cb){
      try {
        var promises = [];
        Object.keys(this.peersStatus).forEach(peer => { // this.peersStatus的key是 组织名,peer名 的字符串，所以变量peer的值为“组织名,peer名”
          var client = this.peersStatus[[peer]]; // 这种语法同this.peersStatus[peer]，client为Admin的实例
          var psPromise = client.GetStatus(client._options["grpc.ssl_target_name_override"]); // 获取状态
          promises.push(psPromise);
        });
        Promise.all(promises).then(function(successMessage){
          logger.debug("GetStatus All!" , successMessage);
          cb(successMessage);
        });
      } catch(err) {
        console.log(err);
        logger.error(err)
        cb([])
    }
  }

  // set up the client and channel objects for each org
  /**
   * 初始化，创建配置文件中所有组织的fabric-client实例、peer实例并缓存
   */
  async initialize() {
    for (let key of configuration.getOrgs()) { // 遍历fabric-client配置中的组织列表
      let client = new hfc(); // 创建fabric-client实例
      let cryptoSuite = hfc.newCryptoSuite(); // 创建密码组件

      var store = await hfc.newDefaultKeyValueStore({ // 创建键值对存储实例
        path: configuration.getKeyStoreForOrg(configuration.getOrgName(key))
      });

      client.setStateStore(store); // 设置存储实例

      await cryptoSuite.setCryptoKeyStore( // 设置密码存储实例
        hfc.newCryptoKeyStore({ // 创建密码存储实例
          path: configuration.getKeyStoreForOrg(configuration.getOrg(key).name)
        })
      );
      client.setCryptoSuite(cryptoSuite); // 设置密码组件

      this.clients[key] = client; // 缓存fabric-client实例
      //For each client setup a admin user as signining identity
      await this.setAdminForClient(key, client); // 给key组织的client实例设置Admin用户

      this.setupPeers(key, client, false); // 遍历key组织的所有peer配置，创建对应的peer实例，并缓存
    }

    await this.setChannels();
  }

  /**
   * 遍历指定组织的所有peer配置，创建对应的peer实例，并缓存
   * @param {string} org 组织名
   * @param {Object} client fabric-client实例
   */
  setupPeers(org, client, isReturn) {
    configuration.getPeersByOrg(org).forEach(key => { // 遍历配置中org组织的peer列表
      let peer;
      if (configuration.getOrg(org)[key]["tls_cacerts"] != undefined) { // peer配置对象有tls_cacerts
        let data = fs.readFileSync( // 读证书
          configuration.getOrg(org)[key]["tls_cacerts"]
        );
        peer = client.newPeer(configuration.getOrg(org)[key].requests, { // 创建peer实例
          pem: Buffer.from(data).toString(),
          "ssl-target-name-override": configuration.getOrg(org)[key][
            "server-hostname"
          ]
        });
        this.addStatusPeer(org, key,configuration.getOrg(org)[key].requests, {
          pem: Buffer.from(data).toString(),
          "ssl-target-name-override": configuration.getOrg(org)[key][
            "server-hostname"
          ]
        });
      } else {
        peer = client.newPeer(configuration.getOrg(org)[key].requests);
        this.addStatusPeer(org, key,configuration.getOrg(org)[key].requests);
      }

      this.peers[[org, key]] = peer; // 缓存peer实例，这种语法存到this.peers中，属性会变成 org+','+key 所得到的字符串
    });
  }

  /**
   * 缓存默认组织的默认peer上的所有FabricChannel实例
   */
  async setChannels() {
    var client = this.getClientForOrg(configuration.getDefaultOrg()); // 获取默认组织的fabric-client实例

    var proxy = this.getDefaultProxy(); // 获取默认组织和默认peer的Proxy实例
    var channelInfo = await proxy.queryChannels(); // 从fabric查询默认peer上的channel

    channelInfo.channels.forEach(chan => { // 遍历应答中的channel列表
      var channelName = chan.channel_id;
      let channel = client.newChannel(channelName); // 创建channel实例
      channel.addPeer(this.getDefaultPeer()); // 将默认peer加入到channel实例中
      this.setupOrderers(client,channel); // 创建fabric-client配置文件中的orderer对应的实例，并加入到channel中
      var channel_event_hub = channel.newChannelEventHub(this.getDefaultPeer()); // 创建ChannelEventHub实例
      this.channels[channelName] = new FabricChannel( // 创建FabricChannel实例，并缓存
        channelName,
        channel,
        channel_event_hub
      );
    });
  }

  //BE303
  /**
   * 创建fabric-client配置文件中的orderer对应的实例，并加入到channel中
   * @param {Object} client fabric-client实例
   * @param {Object} channel channel实例
   */
  async setupOrderers(client,channel) {
    configuration.getOrderersByOrg().forEach(val => { // 遍历orderer的配置列表
    //console.log("Line179-setupOrderers"+JSON.stringify(val));
      let orderer;
      if (val.tls_cacerts != undefined) {
        let data = fs.readFileSync(val.tls_cacerts); // 读证书文件
        orderer = client.newOrderer(val.requests, { // 创建orderer实例
          pem: Buffer.from(data).toString(),"ssl-target-name-override": val["server-hostname"]
          });
      } else {
        orderer = client.newOrderer(val.requests);
      }
    channel.addOrderer(orderer); // 将orderer实例加入到channel
    });
  }

//BE303
  /**
   * 根据配置文件创建fabric-client实例
   * @param {string} userorg 组织名
   * @param {string} orgPath 组织配置JSON文件
   * @param {string} networkCfgPath 网络（多个组织）配置JSON文件
   */
  async getClientFromPath(userorg, orgPath, networkCfgPath) {
    try {
      logger.info(userorg, orgPath, networkCfgPath)
      let config = '-connection-profile-path';
      let networkConfig = 'network' + config;
      hfc.setConfigSetting(networkConfig, networkCfgPath); // 设置fabric-client的全局配置network-connection-profile-path
      hfc.setConfigSetting(userorg + config, orgPath); // 设置fabric-client的全局配置 组织名+'-connection-profile-path'
      let client = hfc.loadFromConfig(hfc.getConfigSetting(networkConfig)); // 加载networkCfgPath JSON文件，返回fabric-client实例
      client.loadFromConfig(hfc.getConfigSetting(userorg + config)); // 加载 组织名+'-connection-profile-path' JSON文件，更新fabric-client实例
      await client.initCredentialStores(); // 初始化client的状态存储和密码组件
      return client;
    } catch (err) {
      logger.error("getClientForOrg", err);
      return null;
    }
  }

  /**
   * 根据指定的配置文件创建fabric-client实例和channel
   * @param {Object} artifacts 组织、网络、channel的配置文件对象
   */
  async createChannel(artifacts) {
    logger.info("############### C R E A T E  C H A N N E L ###############");
    logger.info("Creating channel: " + artifacts.orgName, artifacts.orgConfigPath, artifacts.channelConfigPath);
    try {
      var client = await this.getClientFromPath(artifacts.orgName, artifacts.orgConfigPath,
        artifacts.channelConfigPath); // 根据配置文件创建fabric-client实例
      var envelope = fs.readFileSync(artifacts.channelTxPath); // 读取channel二进制配置文件
      var channelConfig = client.extractChannelConfig(envelope); // 从channel二进制配置文件中提取ConfigUpdate实例
      let signature = client.signChannelConfig(channelConfig); // 获得channel二进制配置文件中当前用户的签名

      let request = {
        config: channelConfig,
        signatures: [signature],
        name: artifacts.channelName,
        txId: client.newTransactionID(true)
      };

      var response = await client.createChannel(request); // 创建channel
      let channelResponse = {
        status: response.status ? response.status : '',
        message: response.info ? response.info : '',
        txId: request.txId.getTransactionID()
      }
      return channelResponse;

    } catch (error) {
      logger.error("createChannel", error)
      return null;
    }
  }
}



module.exports = Platform;