/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { handleActions } from 'redux-actions'
import { Record } from 'immutable'
import * as actionTypes from '../actions/action-types'

const InitialState = new Record({
    loaded: false,
    blockList: [],
    errors: {},

})

// 查询现在时间之前的1天的每小时产生的区块数量
const blockList = handleActions({
    [actionTypes.BLOCK_LIST_POST]: (state = InitialState(), action) => state
        .set('blockList', action.payload.rows)
        .set('loaded', true)
        .set('errors', action.error)

}, new InitialState());


export default blockList
