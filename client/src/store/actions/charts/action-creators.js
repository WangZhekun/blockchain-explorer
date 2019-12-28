/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 查询现在时间之前的1天的每小时产生的区块数量
 * 异步action创建函数
 */
export const blocksPerHour = (curChannel) => dispatch => {
  get('/api/blocksByHour/' + curChannel + '/1')
    .then(resp => {
      dispatch(createAction(actionTypes.BLOCK_CHART_HOUR)(resp))
    }).catch((error) => {
      console.error(error);
    })
}

/**
 * 查询现在时间之前的1个小时的每分钟产生的区块数量
 * 异步action创建函数
 */
export const blocksPerMin = (curChannel) => dispatch => {
  get('/api/blocksByMinute/' + curChannel + '/1')
    .then(resp => {
      dispatch(createAction(actionTypes.BLOCK_CHART_MIN)(resp))
    }).catch((error) => {
      console.error(error);
    })
}

/**
 * 查询现在时间之前的1天的每小时产生的交易数量
 * 异步action创建函数
 */
export const txPerHour = (curChannel) => dispatch => {
  get('/api/txByHour/' + curChannel + '/1')
    .then(resp => {
      dispatch(createAction(actionTypes.TX_CHART_HOUR)(resp))
    }).catch((error) => {
      console.error(error);
    })
}

/**
 * 查询现在时间之前的1个小时的每分钟产生的交易数量
 * 异步action创建函数
 */
export const txPerMin = (curChannel) => dispatch => {
  get('/api/txByMinute/' + curChannel + '/1')
    .then(resp => {
      dispatch(createAction(actionTypes.TX_CHART_MIN)(resp))
    }).catch((error) => {
      console.error(error);
    })
}

/**
 * 查询指定channel上各组织的交易数量
 * 异步action创建函数
 */
export const txByOrg = (curChannel) => dispatch => {
  get('/api/txByOrg/' + curChannel)
    .then(resp => {
      dispatch(createAction(actionTypes.TX_CHART_ORG)(resp))
    }).catch((error) => {
      console.error(error);
    })
}
