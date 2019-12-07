/*
    SPDX-License-Identifier: Apache-2.0
*/

/**
 *
 * Created by shouhewu on 6/8/17.
 *
 */

var http = require("http");
var url = require("url");
var WebSocket = require("ws"); // websocket
var Explorer = require("./app/explorer/Explorer.js") // Explorer应用
var appconfig = require("./appconfig.json"); // http服务的端口和域名配置
var helper = require('./app/helper.js') // 工具模块
var logger = helper.getLogger("main");
var express = require("express");
var path = require("path");
var pgservice = require('./app/persistance/postgreSQL/db/pgservice.js'); // 数据库服务

var host = process.env.HOST || appconfig.host;
var port = process.env.PORT || appconfig.port;

class Broadcaster extends WebSocket.Server { // websocket服务 TODO:问题：WebSocket.Server的用法？
  constructor(server) {
    super({ server });
    this.on("connection", function connection(ws, req) { // 监听connection事件
      const location = url.parse(req.url, true);
      this.on("message", function incoming(message) { // 监听message事件，接受客户端的请求
        console.log("received: %s", message);
      });
    });
  }

  // 向客户端广播
  broadcast(data) {
    this.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

var server; // http服务
async function startExplorer() {
  var explorer = new Explorer(); // 创建Explorer应用实例
  //============ web socket ==============//
  server = http.createServer(explorer.getApp()); // 创建http服务
  var broadcaster = new Broadcaster(server); // 创建websocket服务实例
  await explorer.initialize(broadcaster); // 初始化Explorer应用，添加websocket服务实例
  explorer.getApp().use(express.static(path.join(__dirname, "client/build"))); // 给Explorer应用添加静态资源
  logger.info(
    "Please set logger.setLevel to DEBUG in ./app/helper.js to log the debugging."
  );
  // ============= start server =======================
  server.listen(port, function () { // 启动http服务
    console.log('\n')
    console.log(`Please open web browser to access ：http://${host}:${port}/`);
    console.log('\n')
    console.log('pid is ' + process.pid)
    console.log('\n')
  });
}

startExplorer(); // 创建并启动http服务

let connections = [];
server.on('connection', connection => { // http服务监听connection事件 TODO：问题：这个事件什么时候发生？
  connections.push(connection); // 缓存connection
  connection.on('close', () => connections = connections.filter(curr => curr !== connection)); // http服务监听close事件，将connections中的当前连接过滤掉
});

// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
var shutDown = function () {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => { // 关闭http服务
    console.log('Closed out remaining connections');
    pgservice.closeconnection(); // 断开数据库连接
    process.exit(0);
  });

  setTimeout(() => { // 10秒后执行
    console.error('Could not close connections in time, forcefully shutting down');
    pgservice.closeconnection(); // 断开数据库连接
    process.exit(1);
  }, 10000);

  connections.forEach(curr => curr.end()); // 关闭连接
  setTimeout(() => connections.forEach(curr => curr.destroy()), 5000); // 5秒后销毁连接
}
// listen for TERM signal .e.g. kill
process.on('SIGTERM', shutDown); // 监听进程的SIGTERM事件
// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', shutDown); // 监听进程的SIGINT事件


/*setInterval(() => server.getConnections(
  (err, connections) => console.log(`${connections} connections currently open`)
), 1000);*/