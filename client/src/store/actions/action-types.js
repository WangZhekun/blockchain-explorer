/**
 *    SPDX-License-Identifier: Apache-2.0
 */

const namespaces = 'hyperledger-explorer';

export const PEER_LIST_POST = `${namespaces}/PEER_LIST_POST`; // 获取加入了指定channel的peer列表
export const BLOCK_LIST_POST = `${namespaces}/BLOCK_LIST_POST`; // 查询指定channel上，区块编号大于等于0的区块和交易信息
export const BLOCK_INFO_POST = `${namespaces}/BLOCK_INFO_POST`;
export const CHANNEL_LIST = `${namespaces}/CHANNEL_LIST`; // 获取默认peer加入的所有channel名
export const TX_LIST = `${namespaces}/TX_LIST`; // 获取指定channel上的0号区块及以后的，0号交易及以后的所有交易信息
export const TRANSACTION_POST = `${namespaces}/TRANSACTION_POST`; // 获取指定channel，指定ID的交易信息
export const LATEST_BLOCK = `${namespaces}/LATEST_BLOCK`; // 获取指定channel的最后一个区块
export const CHANNEL = `${namespaces}/CHANNEL`; // 获取默认channel
export const CHAINCODE_LIST_POST = `${namespaces}/CHAINCODE_LIST_POST`;
export const TX_CHART_DATA = `${namespaces}/TX_CHART_DATA`;
export const BLOCK_CHART_MIN = `${namespaces}/BLOCK_CHART_MIN`; // 查询现在时间之前的1个小时的每分钟产生的区块数量
export const BLOCK_CHART_HOUR = `${namespaces}/BLOCK_CHART_HOUR`; // 查询现在时间之前的1天的每小时产生的区块数量
export const TX_CHART_MIN = `${namespaces}/TX_CHART_MIN`; // 查询现在时间之前的1个小时的每分钟产生的交易数量
export const TX_CHART_HOUR = `${namespaces}/TX_CHART_HOUR`; // 查询现在时间之前的1天的每小时产生的交易数量
export const COUNT_HEADER_POST = `${namespaces}/COUNT_HEADER_POST`; // 获取指定channel的统计数据
export const CHAINCODE_LIST = `${namespaces}/CHAINCODE_LIST`; // 获取指定channel上的所有chaincode
export const NOTIFICATION_LOAD = `${namespaces}/NOTIFICATION_LOAD`; // 格式化通知消息
export const TX_CHART_ORG = `${namespaces}/TX_CHART_ORG`; // 查询指定channel上各组织的交易数量
export const CHANGECHANNEL = `${namespaces}/CHANGECHANNEL`; // 修改默认channel名
export const CHANNELS = `${namespaces}/CHANNELS`; // 查询所有channel
export const PEER_STATUS_POST = `${namespaces}/PEER_STATUS_POST`; // 获取指定channel上所有peer的状态

