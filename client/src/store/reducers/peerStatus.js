/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { handleActions } from 'redux-actions'
import { Record } from 'immutable'
import * as actionTypes from '../actions/action-types'

const InitialState = new Record({
    loaded: false,
    peerStatus: [],
    errors: {},

})

// 获取指定channel上所有peer的状态
const peerStatus = handleActions({
    [actionTypes.PEER_STATUS_POST]: (state = InitialState(), action) => state
        .set('peerStatus', action.payload.peers)
        .set('loaded', true)
        .set('errors', action.error)

}, new InitialState());


export default peerStatus
