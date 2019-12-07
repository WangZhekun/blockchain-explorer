/*
 Copyright ONECHAIN 2017 All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var Metrics = require('./metrics')
var BlockListener = require('./BlockListener') // 创建node事件触发器实例，主要监听区块相关的同步事件
var BlockScanner = require('./BlockScanner') // channel、peer、chaincode、区块、交易的同步



var blockPerMinMeter = Metrics.blockMetrics
var txnPerSecMeter = Metrics.txnPerSecMeter
var txnPerMinMeter = Metrics.txMetrics

/**
 * 启动Meter计时器，同步channel、chaincode、peer、orderer、block
 * @param {Object} platform Platform的实例，封装与fabric的交互
 * @param {Object} persistance 数据库服务
 * @param {Object} broadcaster websocket服务实例
 */
async function start(platform, persistance, broadcaster) {

        blockScanner = new BlockScanner(platform, persistance, broadcaster); // channel、peer、chaincode、区块、交易的同步
        blockListener = new BlockListener(blockScanner); // 创建node事件触发器实例，主要监听区块相关的同步事件

        setInterval(function () { // 每500毫秒给meter增加一个状态
            blockPerMinMeter.push(0)
            txnPerSecMeter.push(0)
            txnPerMinMeter.push(0)
        }, 500);

        //Sync Block
        blockListener.emit('syncChannels'); // 触发syncChannels事件，同步channel
        blockListener.emit('syncChaincodes'); // 触发syncChaincodes事件，同步chaincode
        blockListener.emit('syncPeerlist'); // 触发syncPeerlist事件，同步peer
		// ====================Orderer BE-303=====================================
		blockListener.emit('syncOrdererlist'); // 触发syncOrdererlist事件，同步orderer
		// ====================Orderer BE-303=====================================
        blockListener.emit('syncBlock'); // 触发syncBlock事件，同步block
        blockListener.emit('syncChannelEventHubBlock'); // 触发syncChannelEventHubBlock事件 TODO：BlockListener没有这个事件
}


exports.start = start

