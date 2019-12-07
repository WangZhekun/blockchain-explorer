/*
*SPDX-License-Identifier: Apache-2.0
*/

var helper = require('../../helper.js')
var logger = helper.getLogger('blockscanner');
var fileUtil = require('../rest/logical/utils/fileUtils.js'); // 文件工具，用于创建临时目录，和生成hash


/**
 * 该类主要负责channel、peer、chaincode、区块、交易的同步
 */
class BlockScanner {

    /**
     * BlockScanner构造函数
     * @param {Object} platform Platform的实例，表示区块链平台
     * @param {Object} persistance 数据库服务
     * @param {Broadcaster} broadcaster websocket服务实例
     */
    constructor(platform, persistance, broadcaster) {
        this.proxy = platform.getDefaultProxy(); // 获取默认组织的默认peer的代理实例
        this.crudService = persistance.getCrudService(); // 获取数据库的数据持久化服务
        this.broadcaster = broadcaster; // websocket服务实例
    }

    /**
     * 同步默认peer加入的每一个channel的区块的内容（包括区块信息和交易信息）到数据库
     */
    async syncBlock() {
        try {
            var channels = this.proxy.getChannels(); // 获取默认peer加入的channel名列表

            for (let channelName of channels) {
                let maxBlockNum
                let curBlockNum
                [maxBlockNum, curBlockNum] = await Promise.all([
                    this.getMaxBlockNum(channelName), // 获取默认peer节点加入的指定channel的长度
                    this.crudService.getCurBlockNum(channelName) // 从数据库获取指定channel的最大区块编号
                ]);

                await this.getBlockByNumber(channelName, curBlockNum + 1, maxBlockNum); // 同步指定channel上从start到end-1的区块信息和区块内的交易信息到数据库
            };
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 同步区块的信息和区块内的交易到数据库
     * @param {Object} block 区块对象
     */
    async saveBlockRange(block) {

        let first_tx = block.data.data[0]; //get the first Transaction 获取区块中的第一个交易
        let header = first_tx.payload.header; //the "header" object contains metadata of the transaction 获取交易的头
        let firstTxTimestamp = header.channel_header.timestamp; // 获取交易的时间戳
        if (!firstTxTimestamp) {
            firstTxTimestamp = null
        }
        let blockhash = await fileUtil.generateBlockHash(block.header); // 根据区块信息生成hash值

        var blockRecord = {
            'blockNum': block.header.number,
            'txCount': block.data.data.length,
            'preHash': block.header.previous_hash,
            'dataHash': block.header.data_hash,
            'channelName': header.channel_header.channel_id,
            'firstTxTimestamp': header.channel_header.timestamp,
            'blockhash': blockhash
        };

        var blockSaved = await this.crudService.saveBlock(blockRecord); // 将区块信息保存到数据库

        if (blockSaved) {

            //push last block
            var notify = {
                'title': 'Block ' + block.header.number + ' Added',
                'type': 'block',
                'message': 'Block ' + block.header.number + ' established with ' + block.data.data.length + ' tx',
                'time': new Date(firstTxTimestamp),
                'txcount': block.data.data.length,
                'datahash': block.header.data_hash
            };

            this.broadcaster.broadcast(notify); // 向客户端广播

            await this.saveTransactions(block); // 同步区块内的交易内容到数据库

        }
    }

    /**
     * 同步区块内的交易内容到数据库
     * @param {Object} block 区块对象
     */
    async saveTransactions(block) {
        //////////chaincode//////////////////
        //syncChaincodes();
        //////////tx/////////////////////////
        let first_tx = block.data.data[0]; //get the first Transaction 获取区块中的第一个交易
        let header = first_tx.payload.header; //the "header" object contains metadata of the transaction 获取交易的头
        let channelName = header.channel_header.channel_id; // 获取channel名

        let txLen = block.data.data.length // 区块内交易的数量
        for (let i = 0; i < txLen; i++) { // 遍历交易
            let tx = block.data.data[i]
            let chaincode
            try {
                chaincode = tx.payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[1].namespace
            } catch (err) {
                chaincode = ""
            }

            let rwset
            let readSet
            let writeSet
            try {
                rwset = tx.payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset // 读写集合
                readSet = rwset.map(i => { return { 'chaincode': i.namespace, 'set': i.rwset.reads } }) // 读集合
                writeSet = rwset.map(i => { return { 'chaincode': i.namespace, 'set': i.rwset.writes } }) // 写集合
            } catch (err) {
            }

            let chaincodeID
            try {
                chaincodeID =
                    new Uint8Array(tx.payload.data.actions[0].payload.action.proposal_response_payload.extension) // chaincode ID
            } catch (err) {
            }

            let status
            try {
                status = tx.payload.data.actions[0].payload.action.proposal_response_payload.extension.response.status // 交易提案的应答状态
            } catch (err) {
            }

            let mspId = []

            try {
                mspId = tx.payload.data.actions[0].payload.action.endorsements.map(i => { return i.endorser.Mspid }) // 各背书组织的Mspid
            } catch (err) {
            }

            var transaction = {
                'channelname': channelName,
                'blockid': block.header.number.toString(),
                'txhash': tx.payload.header.channel_header.tx_id,
                'createdt': new Date(tx.payload.header.channel_header.timestamp),
                'chaincodename': chaincode,
                'chaincode_id': String.fromCharCode.apply(null, chaincodeID),
                'status': status,
                'creator_msp_id': tx.payload.header.signature_header.creator.Mspid,
                'endorser_msp_id': mspId,
                'type': tx.payload.header.channel_header.typeString,
                'read_set': JSON.stringify(readSet, null, 2),
                'write_set': JSON.stringify(writeSet, null, 2)
            };

            await this.crudService.saveTransaction(transaction); // 保存交易记录到数据库

        }

    }

    /**
     * 同步指定channel上从start到end-1的区块信息和区块内的交易信息到数据库
     * @param {string} channelName channel名
     * @param {number} start 区块起始编号
     * @param {number} end 区块结束编号
     */
    async getBlockByNumber(channelName, start, end) {
        while (start < end) {
            let block = await this.proxy.getBlockByNumber(channelName, start) // 获取默认peer节点加入的指定channel上，编号为start的区块

            try {
                var savedNewBlock = await this.saveBlockRange(block) // 同步区块的信息和区块内的交易到数据库
                if (savedNewBlock) {
                    this.broadcaster.broadcast(); // 向客户端广播 TODO：问题：这里为什么广播参数为空
                }
            }
            catch (err) {
                console.log(err.stack);
                logger.error(err)
            }
            start++
        }
    }

    /**
     * 根据区块的头部对象计算区块的hash
     * TODO：问题：在fileUtils.js中已经有了，为什么还要再实现一次？
     * @param {Object} header 区块的头部对象
     */
    calculateBlockHash(header) {
        let headerAsn = asn.define('headerAsn', function () {
            this.seq().obj(this.key('Number').int(), this.key('PreviousHash').octstr(), this.key('DataHash').octstr());
        });

        let output = headerAsn.encode({ Number: parseInt(header.number), PreviousHash: Buffer.from(header.previous_hash, 'hex'), DataHash: Buffer.from(header.data_hash, 'hex') }, 'der');
        let hash = sha.sha256(output);
        return hash;
    };


    /**
     * 获取默认peer节点加入的指定channel的长度
     * @param {string} channelName channel名
     */
    async getMaxBlockNum(channelName) {
        try {
            var data = await this.proxy.getChannelHeight(channelName); // 获取默认peer节点加入的指定channel的长度
            return data;
        } catch (err) {
            logger.error(err)
        }
    }


    // ====================chaincodes=====================================
    /**
     * 同步默认peer节点加入的channel上实例化的chaincode到数据库
     * @param {string} channelName channel名
     */
    async saveChaincodes(channelName) {
        let chaincodes = await this.proxy.getInstalledChaincodes(channelName, 'Instantiated') // 获取默认peer上的指定channel上实例化的chaincode列表
        let len = chaincodes.length
        if (typeof chaincodes === 'string') {
            logger.debug(chaincodes)
            return
        }
        for (let i = 0; i < len; i++) { // 遍历chaincode列表
            let chaincode = chaincodes[i]
            chaincode.channelname = channelName;
            this.crudService.saveChaincode(chaincode); // 保存chaincode信息到数据库
        }

    }

    /**
     * 同步默认peer加入的channel到数据库
     */
    async saveChannel() {
        var channels = this.proxy.getChannels(); // 获取默认peer加入的channel名列表

        for (let i = 0; i < channels.length; i++) { // 遍历channel名列表
            let date = new Date()
            var channel = {
                blocks: 0, // 区块数
                trans: 0, // 交易数
                name: channels[i],
                createdt: date, // 时间戳
                channel_hash: '' // 最后一个交易的交易id
            };
            channel.blocks = await this.proxy.getChannelHeight(channel.name) // 获取默认peer上指定channel的长度
            for (let j = 0; j < channel.blocks; j++) { // 遍历channel上的区块
                let block = await this.proxy.getBlockByNumber(channel.name, j) // 在默认peer上查询指定channel的指定编号的区块
                channel.trans += block.data.data.length // 统计区块内的交易数
                if (j == 0) {
                    channel.createdt = new Date(block.data.data[0].payload.header.channel_header.timestamp) // 取时间戳 TODO:问题：这个时间戳是区块的还是channel的？
                }
                if (j == channel.blocks - 1) { // 最后一个区块
                    channel.channel_hash = block.data.data[block.data.data.length - 1].payload.header.channel_header.tx_id // 最后一个交易的交易id
                }
            }

            this.crudService.saveChannel(channel); // 保存channel信息到数据库
        }
    }

    /**
     * 同步默认peer加入的channel到数据库
     */
    async syncChannels() {
        try {
            await this.saveChannel();
        } catch (err) {
            logger.error(err)
        }
    }

    /**
     * 同步加入到默认peer上指定channel的peer的信息到数据库
     * @param {string} channelName channel名
     */
    async savePeerlist(channelName) {

        var peerlists = await this.proxy.getConnectedPeers(channelName); // 获取加入到指定channel的Peer实例

        let peerlen = peerlists.length
        for (let i = 0; i < peerlen; i++) { // 遍历peer列表
            var peers = {};
            let peerlist = peerlists[i]
            peers.name = channelName;
            peers.requests = peerlist._url;
            peers.server_hostname = peerlist._options["grpc.default_authority"];

            this.crudService.savePeer(peers); // 保存peer信息到数据库
        }
    }
// ====================Orderer BE-303=====================================
    /**
     * 同步加入到默认peer上指定channel的orderer的信息到数据库
     * @param {string} channelName channel名
     */
    async saveOrdererlist(channelName) {

        var ordererlists = await this.proxy.getConnectedOrderers(channelName); // 获取默认peer上的指定channel上的orderer节点
        let ordererlen = ordererlists.length
        for (let i = 0; i < ordererlen; i++) { // 遍历orderer节点
            var orderers = {};
            let ordererlist = ordererlists[i]
            orderers.requests = ordererlist._url;
            orderers.server_hostname = ordererlist._options["grpc.default_authority"];
            this.crudService.saveOrderer(orderers); // 保存orderer信息到数据库
        }
    }
// ====================Orderer BE-303=====================================
    /**
     * 同步默认peer加入的channel上的所有实例化的chaincode到数据库
     */
    async syncChaincodes() {

        try {
            var channels = this.proxy.getChannels(); // 获取默认peer加入的channel名列表

            for (let channelName of channels) { // 遍历channel名列表
                this.saveChaincodes(channelName); // 同步默认peer节点加入的channel上实例化的chaincode到数据库
            }

        } catch (err) {
            logger.error(err)
        }
    }

    /**
     * 同步加入默认peer上的所有cahnnel的peer及诶单的信息到数据库
     */
    syncPeerlist() {

        try {
            var channels = this.proxy.getChannels(); // 获取默认peer加入的channel名列表

            for (let channelName of channels) { // 遍历channel名列表
                this.savePeerlist(channelName); // 同步加入到默认peer上指定channel的peer的信息到数据库
            }

        } catch (err) {
            logger.error(err)
        }
    }
// ====================Orderer BE-303=====================================
    /**
     * 同步加入到默认peer上所有channel的orderer的信息到数据库
     */
    syncOrdererlist() {

        try {
			var channels = this.proxy.getChannels(); // 获取默认peer加入的channel名列表
			for (let channelName of channels) { // 遍历channel名列表
				this.saveOrdererlist(channelName); // 同步加入到默认peer上指定channel的orderer的信息到数据库
			}
        } catch (err) {
            logger.error(err)
        }
    }
// ====================Orderer BE-303=====================================
    /**
     * 注册默认peer上的所有channel的区块提交事件的处理函数
     */
    syncChannelEventHubBlock() {
        var self = this;
        this.proxy.syncChannelEventHubBlock(block => { self.saveBlockRange(block); }); // 注册默认peer上的所有channel的区块提交事件的处理函数
    }
}

module.exports = BlockScanner;