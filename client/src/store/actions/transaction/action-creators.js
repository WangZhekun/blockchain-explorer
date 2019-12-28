/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 获取指定channel，指定ID的交易信息
 * 异步action创建函数
 * @param {strign} channel channel名称
 * @param {string} txid 交易ID
 */
export const transactionInfo = (channel,txid) => dispatch => {
    get('/api/transaction/' + channel + '/' + txid )
        .then(resp => {
            dispatch(createAction(actionTypes.TRANSACTION_POST)(resp))
        }).catch((error) => {
            console.error(error);
        })
}
