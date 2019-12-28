/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'

/**
 * 格式化通知消息
 * @param {string} notification 通知消息
 */
export const notification = (notification) => dispatch => {
    var notify = JSON.parse(notification);
    dispatch(createAction(actionTypes.NOTIFICATION_LOAD)(notify))
}
