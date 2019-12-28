/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { handleActions } from 'redux-actions'
import { Record } from 'immutable'
import * as actionTypes from '../actions/action-types'

const InitialState = new Record({
    loaded: false,
    txPerMin: [],
    errors: {},

})

// 查询现在时间之前的1个小时的每分钟产生的交易数量
const txPerMin = handleActions({
    [actionTypes.TX_CHART_MIN]: (state = InitialState(), action) => state
        .set('txPerMin', action.payload)
        .set('loaded', true)
        .set('errors', action.error)

}, new InitialState());


export default txPerMin
