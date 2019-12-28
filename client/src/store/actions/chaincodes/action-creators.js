/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 获取指定channel上的所有chaincode
 * 异步action创建函数
 * @param {string} channel channel名称
 */
export const chaincodes = (channel) => dispatch => {
    get(`/api/chaincode/${channel}`)
        .then(resp => {
            dispatch(createAction(actionTypes.CHAINCODE_LIST)(resp))
        }).catch((error) => {
            console.error(error);
        })
}
