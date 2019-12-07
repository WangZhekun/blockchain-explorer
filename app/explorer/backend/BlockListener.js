/*
*SPDX-License-Identifier: Apache-2.0
*/

var EventEmitter = require('events').EventEmitter;

var blockMetrics = require('./metrics').blockMetrics
var txMetrics = require('./metrics').txMetrics

/**
 * 区块相关事件监听
 */
class  BlockListener extends EventEmitter{

        /**
         * 
         * @param {Object} blockScanner BlockScanner类的实例，主要负责channel、peer、chaincode、区块、交易的同步
         */
        constructor(blockScanner)
        {
            super();
            this.blockScanner = blockScanner;

            this.on('createBlock', function (block) { // 监听createBlock事件，创建区块
                blockMetrics.push(1)
                txMetrics.push(block.data.data.length) // 区块内的交易数量

            });

            this.on('syncChaincodes', function () { // 监听syncChaincodes事件，同步chaincode
                    blockScanner.syncChaincodes() // 同步默认peer加入的channel上的所有实例化的chaincode到数据库
            });

            this.on('syncPeerlist', function () { // 监听syncPeerlist事件，同步peer
                    blockScanner.syncPeerlist() // 同步加入默认peer上的所有cahnnel的peer及诶单的信息到数据库
            });

            this.on('syncChannels', function () { // 监听syncChannels，同步channel
                    blockScanner.syncChannels() // 同步默认peer加入的channel到数据库
            });
// ====================Orderer BE-303=====================================		
			this.on('syncOrdererlist', function () { // 监听syncOrdererlist事件，同步orderer
                    blockScanner.syncOrdererlist() // 同步加入到默认peer上所有channel的orderer的信息到数据库
            });
// ====================Orderer BE-303=====================================
            this.on('syncBlock', async function () { // 监听syncBlock事件，同步区块
                    await blockScanner.syncBlock(); // 同步默认peer加入的每一个channel的区块的内容（包括区块信息和交易信息）到数据库
                    blockScanner.syncChannelEventHubBlock(); // 注册默认peer上的所有channel的区块提交事件的处理函数
            });
        }
}

module.exports = BlockListener;