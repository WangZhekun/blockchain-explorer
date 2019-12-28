/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { handleActions } from 'redux-actions';
import { Record } from 'immutable';
import * as actionTypes from '../actions/action-types';

const InitialState = new Record({ // 创建一个React工厂方法，参数为记录内各字段的默认值
    loaded: false,
    block: {},
    errors: {},
});

const block = handleActions({ // 包装reducer，使它只处理Flux标准action
    [actionTypes.BLOCK_INFO_POST]: (state = InitialState(), action) => state
        .set('loaded', true)
        .set('block', action.payload)
        .set('errors', action.error),

}, new InitialState());

export default block