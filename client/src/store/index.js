/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk' // 使Redux支持异步数据流
import rootReducers from './reducers/index'

export default (initialState = {}) => {
    const store = createStore( // 创建store
        rootReducers,
        initialState,
        applyMiddleware(thunk)
    )
    return store;
}