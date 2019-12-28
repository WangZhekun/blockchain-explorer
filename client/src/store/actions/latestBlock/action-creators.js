/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 获取指定channel的最后一个区块
 * 异步action创建函数
 * @param {string} channel channel名称
 */
export const latestBlock = (channel) => dispatch => {
    // 获取指定channel的统计数据
    get('/api/status/'+channel)
        .then(resp => {
            dispatch(createAction(actionTypes.LATEST_BLOCK)(resp.latestBlock))
        }).catch((error) => {
            console.error(error);
        })
}
