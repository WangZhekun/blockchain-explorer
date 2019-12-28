/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions' // createAction用来包装action创建函数，使其可以创建包含满足Flux标准action的payload属性的action
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 查询指定channel上，区块编号大于等于0的区块和交易信息
 * 异步action创建函数
 * @param {string} channel channel名称
 */
export const blockList = (channel) => dispatch => {
    get(`/api/blockAndTxList/${channel}/0`)
        .then(resp => {
            dispatch(createAction(actionTypes.BLOCK_LIST_POST)(resp)) // createAction(actionTypes.BLOCK_LIST_POST)(resp) 返回{type: actionTypes.BLOCK_LIST_POST, payload: resp}
        }).catch((error) => {
            console.error(error);
        })
}
