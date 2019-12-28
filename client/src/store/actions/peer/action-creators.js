/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 获取指定channel上所有peer的状态
 * 异步action创建函数
 * @param {string} channel channel名称
 */
export const peerStatus = (channel) => dispatch => {
    get('/api/peersStatus/'+channel)
        .then(resp => {			
            dispatch(createAction(actionTypes.PEER_STATUS_POST)(resp))
        }).catch((error) => {
            console.error(error);
        })
}

/**
 * 获取加入了指定channel的peer列表
 * 异步action创建函数
 * @param {string} channel channel名称
 */
export const peerList = (channel) => dispatch => {
  get('/api/peers/' + channel)
    .then(resp => {
      dispatch(createAction(actionTypes.PEER_LIST_POST)(resp))
    }).catch((error) => {
      console.error(error);
    })
}
