/**
 *    SPDX-License-Identifier: Apache-2.0
 */
var express = require("express");
var bodyParser = require("body-parser");
var dbroutes = require("./rest/dbroutes.js"); // 数据库相关的reset接口
var platformroutes = require("./rest/platformroutes.js"); // 区块链平台相关的reset接口
var explorerconfig = require("./explorerconfig.json"); // 应用配置文件
var PersistanceFactory = require("../persistance/PersistanceFactory.js"); // 数据库服务工厂
var timer = require("./backend/timer.js"); // 计时器服务，从区块链平台同步数据到数据库
const swaggerUi = require('swagger-ui-express'); // swagger文档
const swaggerDocument = require('../../swagger.json'); // swagger配置

class Explorer { // 业务模块
    constructor() {
        this.app = express(); // Express实例
        this.app.use(bodyParser.json()); // 请求体解析，解析application/json
        this.app.use(bodyParser.urlencoded({ extended: true })); // 请求体解析，解析经urlencoded编码的参数
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); // swagger文档接口
        this.persistance = {}; // 数据库服务
        this.platforms = explorerconfig["platforms"]; // ['fabric'] 区块链平台

    }

    /**
     * 获取express实例
     */
    getApp() {
        return this.app;
    }

    /**
     * 初始化Explorer服务，加载reset接口
     * @param {Object} broadcaster websocket服务实例
     */
    async initialize(broadcaster) {

        this.persistance = await PersistanceFactory.create(explorerconfig["persistance"]); // 创建数据库服务
        dbroutes(this.app, this.persistance); // 加入数据库相关的reset接口
        for (let pltfrm of this.platforms) { // 遍历支持的区块链平台
          await platformroutes(this.app, pltfrm, this.persistance); // 加入区块链平台相关的reset接口
          timer.start(platform, this.persistance, broadcaster); // 启动计时器，从区块链平台同步数据到数据库 TODO:问题:这个对象什么时候创建?
        }
    }
}

module.exports = Explorer;