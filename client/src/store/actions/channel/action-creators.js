/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 获取默认channel
 * 异步action创建函数
 */
export const getChannel = () => dispatch => {
    get('/api/curChannel')
        .then(resp => {
            dispatch(createAction(actionTypes.CHANNEL)(resp))
        }).catch((error) => {
            console.error(error);
        })
}

/**
 * 修改默认channel名
 * 异步action创建函数
 * @param {string} channelName channel名称
 */
export const changeChannel = (channelName) => dispatch => {
    get('/api/changeChannel/' + channelName)
        .then(resp => {
            dispatch(createAction(actionTypes.CHANGECHANNEL)(resp))
        }).catch((error) => {
            console.error(error);
        })
}