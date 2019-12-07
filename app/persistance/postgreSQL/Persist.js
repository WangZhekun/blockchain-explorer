/**
*    SPDX-License-Identifier: Apache-2.0
*/

var CRUDService = require('./CRUDService.js'); // 数据持久化服务
var MetricService = require('./MetricService.js'); // 统计数据服务
var pgservice = require('./db/pgservice.js'); // 数据库访问服务

/**
 * 数据库访问服务的封装，包含统计数据和持久化数据访问服务
 */
class Persist {

    constructor() {
    }

    async initialize() {

        await pgservice.handleDisconnect();
        this.metricservice = new MetricService();
        this.crudService = new CRUDService();
    }

    /**
     * 获取统计数据访问服务
     */
    getMetricService() {
        return this.metricservice;
    }

    /**
     * 获取持久化数据访问服务
     */
    getCrudService() {
        return this.crudService;
    }

}

module.exports = Persist;