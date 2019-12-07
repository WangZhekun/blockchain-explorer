/*
    SPDX-License-Identifier: Apache-2.0
*/

const util = require('util');
var path = require('path');
const exec = util.promisify(require('child_process').exec);
var config = require('../../../platform/fabric/config.json');
var fileUtil = require('./utils/fileUtils.js');
var helper = require('../../../helper.js');
var configtxgenToolPath = config.configtxgenToolPath;
var fs = require('fs');
var logger = helper.getLogger('channelservice');
logger.setLevel('INFO');

/**
 * 生成channel二进制文件（.tx文件）和区块文件（.block文件）
 * @param {Object} artifacts 请求参数重新组装的对象
 */
var generateChannelArtifacts = async function (artifacts) {
    let artifactsDir = await fileUtil.generateDir(); // 在 /tmp 目录创建已时间戳命名的目录，获取该目录的路径
    var artifactChannelPath = path.resolve(artifactsDir); // 
    let channelTxPath = `${artifactChannelPath}/${artifacts.channelName}.tx`; // channel二进制文件的地址
    let channelBlockPath = `${artifactChannelPath}/${artifacts.channelName}.block`; // TODO：问题：这个文件是干什么的？
    logger.info(` ${configtxgenToolPath}/configtxgen -profile ${artifacts.profile} -outputCreateChannelTx ${channelTxPath} -channelID ${artifacts.channelName} `)
    logger.info(` ${configtxgenToolPath}/configtxgen -profile ${artifacts.genesisBlock} -outputBlock ${channelBlockPath} `)

    const [status] = await Promise.all([ // 用configtxgen命令生成channel二进制文件（.tx文件）和区块文件（.block文件）
        exec(` ${configtxgenToolPath}/configtxgen -profile ${artifacts.profile} -outputCreateChannelTx ${channelTxPath} -channelID ${artifacts.channelName} `),
        exec(` ${configtxgenToolPath}/configtxgen -profile ${artifacts.genesisBlock} -outputBlock ${channelBlockPath} `)
    ]).catch((error) => {
        logger.error(error);
        throw new Error(error);
    })
    let channelArtifacts = {
        channelTxPath: channelTxPath,
        channelBlockPath: channelBlockPath
    }
    return channelArtifacts;
}



/**
 * 在默认peer节点，创建channel，并保存到数据库
 * @param {Object} artifacts 请求参数重新组装的对象
 * @param {Platform} platform Platform的实例，封装与fabric的交互
 * @param {Object} crudService 数据库的数据持久化服务
 */
async function createAndSave(artifacts, platform, crudService) {
    try {

        let response = await platform.createChannel(artifacts); // 根据指定的配置文件创建fabric-client实例和channel
        if (response && response.status === 'SUCCESS' && response.txId) {
            artifacts.channelHash = response.txId;
            logger.info('Successfully created the channel, channel hash', artifacts.channelHash);
            let saveCh = await crudService.saveChannelRow(artifacts); // 保存channel信息到数据库
            let resp = {
                success: true,
                message: 'Successfully created channel ' + artifacts.channelName
            };
            return resp;
        } else {
            logger.error('Failed to create the channel ' + artifacts.channelName, response);
            let resp = {
                success: false,
                message: response.info ? response.info : 'Failed to create the channel ' + artifacts.channelName
            };
            return resp
        }
    } catch (error) {
        logger.error("createAndSave", error)
        let resp = {
            success: false,
            message: 'Failed to created channel ' + artifacts.channelName
        };
        return resp;
    }
}

/**
 * 生成channel的二进制文件，在默认peer节点，创建channel，并保存到数据库
 * @param {Object} artifacts 请求参数重新组装的对象
 * @param {Platform} platform Platform的实例，封装与fabric的交互
 * @param {Object} crudService 数据库的数据持久化服务
 */
async function createChannel(artifacts, platform, crudService) {
    try {
        if (artifacts && artifacts.channelName && artifacts.profile && artifacts.genesisBlock) {
            // generate genesis block and channel transaction             //
            let channelGenesis = await generateChannelArtifacts(artifacts, crudService); // 生成channel二进制文件（.tx文件）和区块文件（.block文件）
            artifacts.channelTxPath = channelGenesis.channelTxPath; // channel二进制文件
            try {
                let createChannelAndSave = await createAndSave(artifacts, platform, crudService); // 在默认peer节点，根据创建channel，并保存到数据库
                let chResp = {
                    success: createChannelAndSave.success,
                    message: createChannelAndSave.message
                };
                return chResp;
            } catch (err) {
                let response = {
                    success: false,
                    message: err
                };
                return response;
            }
        } else {
            logger.debug("artifacts ", artifacts)
            let response = {
                success: false,
                message: "Invalid request "
            };
            return response;
        }
    } catch (err) {
        logger.error("createChannel ", err)
        let response = {
            success: false,
            message: "Invalid request, payload"
        };
        return response;
    }

}

exports.createAndSave = createAndSave
exports.createChannel = createChannel
exports.generateChannelArtifacts = generateChannelArtifacts