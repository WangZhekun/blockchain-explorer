/**
 *    SPDX-License-Identifier: Apache-2.0
 */

/**
 * 查询现在时间之前的1个小时的每分钟产生的区块数量
 */
export const getBlockPerMin = (state) => (state.blockPerMin.blockPerMin); 
/**
 * 查询现在时间之前的1天的每小时产生的区块数量
 */
export const getBlockperHour = (state) => (state.blockPerHour.blockPerHour);
/**
 * 查询现在时间之前的1个小时的每分钟产生的交易数量
 */
export const getTxPerMin = (state) => (state.txPerMin.txPerMin);
/**
 * 查询现在时间之前的1天的每小时产生的交易数量
 */
export const getTxPerHour = (state) => (state.txPerHour.txPerHour);
/**
 * 获取默认channel
 */
export const getChannel = (state) => (state.channel.channel);

export const getBlock = (state) => (state.block.block);
/**
 * 查询现在时间之前的1天的每小时产生的区块数量
 */
export const getBlockList = (state) => (state.blockList.blockList);
/**
 * 获取指定channel上的所有chaincode
 */
export const getChaincodes = (state) => (state.chaincodes.chaincodes);
/**
 * 获取默认peer加入的所有channel名
 */
export const getChannelList = (state) => (state.channelList.channelList);
/**
 * 获取指定channel的统计数据
 */
export const getCountHeader = (state) => (state.countHeader.countHeader);
/**
 * 获取通知消息
 */
export const getNotification = (state) => (state.notification.notification);
/**
 * 获取加入了指定channel的peer列表
 */
export const getPeerList = (state) => (state.peerList.peerList);
/**
 * 获取指定channel上所有peer的状态
 */
export const getPeerStatus = (state) => (state.peerStatus.peerStatus);
/**
 * 获取指定channel，指定ID的交易信息
 */
export const getTransaction = (state) => (state.transaction.transaction);
/**
 * 获取指定channel上的0号区块及以后的，0号交易及以后的所有交易信息
 */
export const getTransactionList = (state) => (state.transactionList.transactionList);
/**
 * 查询所有channel
 */
export const getChannels = (state) => (state.channels.channels);
/**
 * 查询指定channel上各组织的交易数量
 */
export const getTxByOrg = (state) => (state.txByOrg.txByOrg)
