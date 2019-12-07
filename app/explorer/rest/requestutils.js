/*
    SPDX-License-Identifier: Apache-2.0
*/
var multer = require('multer'); // node中间件，用于处理 multipart/form-data 类型的表单数据，主要用于上传文件

/**
 * 400请求处理
 * @param {Object} req HTTP请求对象
 * @param {Object} res HTTP应答对象
 */
function invalidRequest(req, res) {
    let payload = reqPayload(req); // 将请求的url参数、query参数、和请求体组装成数组
    res.send({
        status: 400,
        error: "BAD REQUEST",
        "payload": payload
    })
}

/**
 * 404请求处理
 * @param {Object} req HTTP请求对象
 * @param {Object} res HTTP应答对象
 */
function notFound(req, res) {
    let payload = reqPayload(req); // 将请求的url参数、query参数、和请求体组装成数组
    res.send({
        status: 404,
        error: "NOT FOUND",
        "payload": payload
    })
}

/**
 * 将请求的url参数、query参数、和请求体组装成数组
 * @param {Object} req HTTP请求对象
 */
function reqPayload(req) {
    let reqPayload = [];
    const {     params,
        query,
        body
    } = req; // 取请求中的url参数、query参数、和请求体



    reqPayload.push({
        "params": params
    })

    reqPayload.push({
        "query": query
    })

    reqPayload.push({
        "body": body
    })
    return reqPayload; // 将三种参数组装成数组返回
}


/**
 * Upload channel artifacts(channel and org configuration) and call SDK for NODEjs to create a channel
 */

var storage = multer.diskStorage({ // 上传的文件的磁盘存储配置
    destination: function (req, file, callback) { // 配置文件存储的位置
        callback(null, '/tmp'); // 存储在 /tmp 目录中
    },
    filename: function (req, file, callback) { // 存储文件的文件名
        callback(null, file.originalname); // 传入文件名
    }
});


// set to upload 2 files, can be increased by updating array
var upload = multer({ // multer函数的参数中的storage，表示上传的文件需要保存到哪里
    storage: storage
}).array('channelArtifacts', 2); // 接收请求中以channelArtifacts为表单域的key的文件数组，数组最多两个元素，文件信息会被保存到req.files


/**
 * 异步调用multer，对上传的文件进行处理，重新组装请求参数
 * @param {Object} req HTTP请求对象
 * @param {Object} res HTTP应答对象
 */
function aSyncUpload(req, res) {
    return new Promise(function (resolve, reject) {
        upload(req, res, function (err) {
            var channelTxPath = null;
            var blockPath = null;
            var channelName = req.body.channelName;
            var orgName = req.body.orgName;
            var profile = req.body.profile;
            var genesisBlock = req.body.genesisBlock;
            var configFiles = req.files; // 文件
            var channelConfigPath = null;
            var channelConfigName = null;
            var orgConfigPath = null;
            var orgConfigName = null;
            var channelHash = null;

            if (channelName && orgName && profile && configFiles) { // 请求参数的重新组合
                channelConfigPath = configFiles[0].path;
                orgConfigPath = configFiles[1].path;
                channelConfigName = configFiles[0].originalname;
                orgConfigName = configFiles[1].originalname;

                let fileAtifacts = {
                    blockPath: blockPath,
                    channelName: channelName,
                    orgName: orgName,
                    profile: profile,
                    genesisBlock: genesisBlock,
                    configFiles: configFiles,
                    channelConfigName: channelConfigName,
                    orgConfigName: orgConfigName,
                    channelConfigPath: channelConfigPath,
                    orgConfigPath: orgConfigPath,
                    channelTxPath: "",
                    channelHash: ""
                }

                if (err) {
                    reject(err)
                }

                if (fileAtifacts)
                    resolve(fileAtifacts)
                else
                    resolve({})
            } else {
                let response = {
                    success: false,
                    message: "Invalid request, payload"
                };
                reject(response)
            }
        });
    })
}


module.exports = {
    invalidRequest,
    notFound,
    reqPayload,
    aSyncUpload
};