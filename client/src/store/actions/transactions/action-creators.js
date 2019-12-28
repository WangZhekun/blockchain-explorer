/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 获取指定channel上的0号区块及以后的，0号交易及以后的所有交易信息
 * 异步action创建函数
 * @param {string} channel channel名称
 */
export const transactionList = (channel) => dispatch => {
    get('/api/txList/'+channel+'/0/0/')
        .then(resp => {
            dispatch(createAction(actionTypes.TX_LIST)(resp))
        }).catch((error) => {
            console.error(error);
        })
}
