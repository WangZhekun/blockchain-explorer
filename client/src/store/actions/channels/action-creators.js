/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from 'redux-actions'
import * as actionTypes from '../action-types'
import { get } from '../../../services/request.js';

/**
 * 查询所有channel
 * 异步action创建函数
 */
export const channelsData = () => dispatch => {
  get('/api/channels/info')
    .then(resp => {
      dispatch(createAction(actionTypes.CHANNELS)(resp.channels))
    }).catch((error) => {
      console.error(error);
    })
}
