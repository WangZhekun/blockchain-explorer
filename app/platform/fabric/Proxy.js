/*
*SPDX-License-Identifier: Apache-2.0
*/

var path = require('path');
var fs = require('fs');
var util = require('util');
var hfc = require('fabric-client');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var helper = require('../../helper.js');
var logger = helper.getLogger('Query');
var configuration = require('./Configuration.js'); // 访问网络配置的Configuration类
var chaincodeService = require('./service/chaincodeService.js'); // 读取chaincode文件服务
var jch = require('./service/joinChannel.js'); // 加入channel服务

/**
 * 该类主要是Peer节点的代理,包含fabric-client实例，peer实例加入到的FabricChannel实例的列表
 */
class Proxy {

		/**
		 * 构造函数
		 * @param {Object} target peer实例
		 * @param {Object} client fabric-client实例
		 * @param {Object} channels channel名称到FabricChannel实例的映射对象
		 */
		constructor(target, client, channels) {
			this.peerFailures = 0; // 连接Peer节点错误次数
			this.target = target;
			this.client = client;
			this.channels = channels;
		}

		/**
		 * 获取制定channel的channel实例
		 * @param {strign} channelName channel名称
		 */
		getChannel(channelName) {
			return this.channels[channelName].channel;
		}

		/**
		 * 获取实例中缓存的channel名列表
		 */
		getChannels() {
			return Object.keys(this.channels);
		}

		/**
		 * 获取实例中缓存的FabricChannel实例列表
		 */
		getChannelObjects() {
			return Object.values(this.channels);
		}

		/**
		 * 获取指定channel的ChannelEventHub实例
		 * @param {string} channelName channel名称
		 */
		getChannelEventHub(channelName) {
			return this.channels[channelName].channelEventHub;
		}

		/**
		 * 执行指定channel的指定chaincode的用于查询的回调函数
		 * @param {string} channelName channel名称
		 * @param {strign} chaincodeName chaincode名
		 * @param {string} fcn 提案提交后，执行的chaincode函数名
		 * @param {Array<string>} args 提案提交后，执行的chaincode函数参数列表
		 */
		queryChaincode(channelName, chaincodeName, fcn, args) {
			var channel = this.getChannel(channelName); // 获取channel实例

			//Let Cahnnel use second peer added
			if (peerFailures > 0) { // 如果连接peer节点错误次数大于0，将channel实例中的第一个peer实例取出重新加入，TODO:猜测:channel实例内是用数组保存peer实例，此处是调整peer实例的位置，以便下一次重试换一个peer节点
				let peerToRemove = channel.getPeers()[0];
				channel.removePeer(peerToRemove);
				channel.addPeer(peerToRemove);
			}
			tx_id = this.client.newTransactionID(); // 创建TransactionID实例
			// send query
			var request = {
				chaincodeId: chaincodeName,
				txId: tx_id,
				fcn: fcn,
				args: args
			};
			return channel.queryByChaincode(request, this.target); // 提交交易提案，执行chaincode的fcn函数
		}

		/**
		 * 在当前peer上查询指定channel的指定编号的区块
		 * @param {string} channelName channel名
		 * @param {number} blockNumber 区块编号
		 */
		getBlockByNumber(channelName, blockNumber) {

			var channel = this.getChannel(channelName); // 获取channel实例
			return channel.queryBlock(parseInt(blockNumber), this.target).then((channelinfo) => { // 在当前peer节点上查询指定编号的区块
				if (channelinfo) {
					return channelinfo;
				} else {
					logger.error('response_payloads is null');
					return 'response_payloads is null';
				}
			}, (err) => {
				logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
					err);
				return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
			}).catch((err) => {
				logger.error('Failed to query with error:' + err.stack ? err.stack : err);
				return 'Failed to query with error:' + err.stack ? err.stack : err;
			});
		};

		/**
		 * 在当前peer上查询指定channel的指定ID的交易
		 * @param {string} channelName channel名
		 * @param {string} trxnID 交易ID
		 */
		getTransactionByID(channelName, trxnID) {
			if (trxnID) {
			var channel = this.getChannel(channelName); // 获取channel实例
			return channel.queryTransaction(trxnID, this.target); // 查询指定ID的交易
			}
			return {};

		}

		/**
		 * 在当前peer上查询指定channel的指定hash的区块
		 * @param {string} channelName channel名
		 * @param {string} hash 区块的hash
		 */
		getBlockByHash(channelName, hash) {
			var channel = this.getChannel(channelName); // 获取channel实例
			return channel.queryBlockByHash(new Buffer(hash, "hex"), this.target); // 查询指定hash的区块
		}

		/**
		 * 在当前peer上查询指定channel的信息
		 * @param {string} channelName channel名
		 */
		async getChainInfo(channelName) {
			var channel = this.getChannel(channelName); // 获取channel实例

			try {
					var blockchainInfo = await channel.queryInfo(this.target, true); // 查询channel的信息

					if (blockchainInfo) {
						// FIXME: Save this for testing 'getBlockByHash'  ?
						logger.debug('===========================================');
						logger.debug(blockchainInfo.currentBlockHash);
						logger.debug('===========================================');
						//logger.debug(blockchainInfo);
						return blockchainInfo;
					} else {
						logger.error('response_payloads is null');
						return 'response_payloads is null';
					}
			} catch  (err) {
				logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
					err);
				return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
			}
		}

		//getInstalledChaincodes
		/**
		 * 在当前peer上查询已安装的或在指定channel上已实例化的chaincode
		 * @param {string} channelName channel名
		 * @param {string} type chaincode类型，installed表示已安装的，默认为已实例化的
		 */
		async getInstalledChaincodes(channelName, type) {

			var channel = this.getChannel(channelName); // 获取channel实例

			var response;

			try{
					if (type === 'installed') {
						response = await this.client.queryInstalledChaincodes(this.target, true); // 查询在当前peer上安装的chaincode
					} else {
						response = await channel.queryInstantiatedChaincodes(this.target, true); // 查询在channel上实例化的chaincode
					}
			} catch(err){
				logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
					err);
				return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
			}

			if (response) {
				if (type === 'installed') {
					logger.debug('<<< Installed Chaincodes >>>');
				} else {
					logger.debug('<<< Instantiated Chaincodes >>>');
				}
				var details = [];
				for (let i = 0; i < response.chaincodes.length; i++) {
					let detail = {}
					logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
						response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
					);
					detail.name = response.chaincodes[i].name
					detail.version = response.chaincodes[i].version
					detail.path = response.chaincodes[i].path
					details.push(detail);
				}
				return details;
			} else {
				logger.error('response is null');
				return 'response is null';
			}
		}

		/**
		 * 获取加入到指定channel的组织
		 * 返回OrganizationIdentifier实例数组，实例中包含组织的MSP id
		 * @param {string} channelName channel名
		 */
		getOrganizations(channelName) {
			var channel = this.getChannel(channelName); // 获取channel实例
			return channel.getOrganizations(); // 获取加入到channel上的组织（OrganizationIdentifier实例，其中包含组织的MSP id）
		}

		/**
		 * 获取加入到指定channel的Peer实例
		 * @param {string} channelName channel名
		 */
		getConnectedPeers(channelName) {
			return this.getChannel(channelName).getPeers();  // 获取channel实例的Peer实例列表
		}
		
		//Orderer Info BE-303
		/**
		 * 获取加入到指定channel的orderer实例
		 * @param {strign} channelName channel名
		 */
		getConnectedOrderers(channelName) {		
			return this.getChannel(channelName).getOrderers();  // 获取channel实例的Orderer实例列表
		}
		//Orderer Info BE-303
		
		/**
		 * 获取制定channel的长度
		 * @param {string} channelName channel名
		 */
		async getChannelHeight(channelName) {
			var response =  await this.getChainInfo(channelName);
			if (response) {
				logger.debug('<<<<<<<<<< channel height >>>>>>>>>')
				if (response.height.low) {
					logger.debug("response.height.low ", response.height.low);
					return response.height.low.toString()
				}
			}

			return "0";
		}

		/**
		 * 注册当前实例缓存的所有channel的区块提交事件的处理函数
		 * @param {function} callback 回调函数
		 */
		async syncChannelEventHubBlock(callback) {

			var fabChannels = this.getChannelObjects(); // 获取实例中缓存的FabricChannel实例列表

			fabChannels.forEach( fabChannel => { // 遍历FabricChannel实例列表
				var channel_event_hub = fabChannel.channelEventHub; // 取ChannelEventHub实例

				channel_event_hub.connect(true); // 将事件监听器连接到peer

				channel_event_hub.registerBlockEvent( // 注册区块提交到channel的事件监听
					function (block) {
						console.log('Successfully received the block event' + block);
						if (block.data != undefined) {
							//full block

							try {
								callback(block);
							} catch(err) {
								console.log(err.stack);
								logger.error(err)
							}
						} else {
							//filtered block
							console.log('The block number' + block.number);
							console.log('The filtered_tx' + block.filtered_tx);
							console.log('The block event channel_id' + block.channel_id);
						}
					},
					(error) => {
						console.log('Failed to receive the block event ::' + error);
					}
				);
			});
		}

		/**
		 * 查询当前peer节点上的channel列表
		 * 返回channel列表的应答对象
		 */
		async queryChannels() {

			try {
				var channelInfo = await this.client.queryChannels(this.target); // 查询当前peer上的channel
				if (channelInfo) {
					return channelInfo;
				}
				else {
						logger.error('response_payloads is null');
						return 'response_payloads is null';
				}
			} catch(err) {
				logger.error('Failed to send query due to error: ' + err.stack ? err.stack :
					err);
				return 'Failed to send query due to error: ' + err.stack ? err.stack : err;
			}
		}

		/**
		 * 从数据库查询指定channel上区块的数量
		 * @param {string} channelName channel名
		 */
		async getCurBlockNum(channelName) {
			try {
			var row = await sql.getRowsBySQlCase(`select max(blocknum) as blocknum from blocks  where channelname='${channelName}'`);

			} catch(err) {
				logger.error(err)
				return -1;
			}

			let curBlockNum

			if (row == null || row.blocknum == null) {
				curBlockNum = -1
			} else {
				curBlockNum = parseInt(row.blocknum)
			}

			return curBlockNum
		}

		/**
		 * 将peers中的peer节点加入到指定channel中
		 * @param {string} channelName channel名
		 * @param {Array<string>} peers peer名列表
		 * @param {string} orgName 组织名
		 * @param {Object} platform Platform实例
		 */
		joinChannel(channelName, peers, orgName, platform) {
			let jc = jch.joinChannel(channelName, peers, orgName, platform);
			return jc;
		}

		/**
		 * 获取默认的channel名称
		 */
		getDefaultChannel(){
			return configuration.getCurrChannel();
		}

		/**
		 * 修改默认channel名
		 * @param {string} channel channel名
		 */
		changeChannel(channel){
			return configuration.changeChannel(channel);
		}

		/**
		 * 读取chaincode文件内容
		 * @param {string} path Chaincode的文件路径或文件地址
		 */
		async loadChaincodeSrc(path) {
			return chaincodeService.loadChaincodeSrc(path);
		}
}

module.exports = Proxy;