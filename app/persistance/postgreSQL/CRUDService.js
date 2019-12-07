/**
 *    SPDX-License-Identifier: Apache-2.0
 */

var sql = require('./db/pgservice.js');
var helper = require('../../helper.js')
var fs = require('fs');
var path = require('path');
var logger = helper.getLogger('blockscanner');

class CRUDService {

    constructor() {

    }


    /**
     * 查询指定channel上的指定编号的区块的交易数量
     * @param {string} channelName channel名
     * @param {number} blockNum 区块编号
     */
    getTxCountByBlockNum(channelName, blockNum) {
        return sql.getRowByPkOne(`select blocknum ,txcount from blocks where channelname='${channelName}' and blocknum=${blockNum} `);
    }

    /**
     * 查询指定hash的交易
     * @param {string} channelName channel名
     * @param {string} txhash 交易hash
     */
    getTransactionByID(channelName, txhash) {
        let sqlTxById = ` select * from TRANSACTION where txhash = '${txhash}' `;
        return sql.getRowByPkOne(sqlTxById);
    }

    /**
     * 查询指定channel上，区块编号大于等于blockNum，交易id大于等于txid的交易
     * @param {string} channelName channel名
     * @param {number} blockNum 区块编号
     * @param {string} txid 交易id
     */
    getTxList(channelName, blockNum, txid) {
        let sqlTxList = ` select * from transaction where  blockid >= ${blockNum} and id >= ${txid} and
         channelname = '${channelName}'  order by  transaction.id desc`;
        return sql.getRowsBySQlQuery(sqlTxList);

    }

    /**
     * 查询指定channel上，区块编号大于等于blockNum的区块和交易信息
     * @param {string} channelName channel名
     * @param {number} blockNum 区块编号
     */
    getBlockAndTxList(channelName, blockNum) {

        let sqlBlockTxList = ` select blocks.*,(
        SELECT  array_agg(txhash) as txhash FROM transaction where blockid = blocks.blocknum and channelname = blocks.channelname group by transaction.blockid )  from blocks where
         blocks.channelname ='${channelName}' and blocknum >= ${blockNum}
         order by blocks.blocknum desc`;
        return sql.getRowsBySQlQuery(sqlBlockTxList);
    }

    /**
     * 查询指定名称的channel
     * @param {string} channelName channel名
     */
    async getChannelConfig(channelName) {
        let channelConfig = await sql.getRowsBySQlCase(` select * from channel where name ='${channelName}' `);
        return channelConfig;
    }

    /**
     * 保存channel
     * @param {Object} artifacts 组织、网络、channel的配置文件对象
     */
    async saveChannelRow(artifacts) {
        var channelTxArtifacts = fs.readFileSync(artifacts.channelTxPath);
        var channelConfig = fs.readFileSync(artifacts.channelConfigPath);
        try {

            let insert = await sql.saveRow('channel', {
                'name': artifacts.channelName,
                'channel_hash': artifacts.channelHash,
                'channel_config': channelConfig,
                'channel_tx': channelTxArtifacts,
                'createdt': new Date()
            });

            let resp = {
                success: true,
                message: 'Channel ' + artifacts.channelName + " saved"
            };

            return resp;
        } catch (err) {
            let resp = {
                success: false,
                message: 'Faile to save channel ' + artifacts.channelName + " in database "
            };
            return resp;
        }

    }

    /**
     * 保存区块
     * @param {Object} block 区块对象
     */
    async saveBlock(block) {

        let c = await sql.getRowByPkOne(`select count(1) as c from blocks where blocknum='${block.blockNum}' and txcount='${block.txCount}' and prehash='${block.preHash}' and datahash='${block.dataHash}' and channelname='${block.channelName}' `)
        if (c.c == 0) {
            await sql.saveRow('blocks', {
                'blocknum': block.blockNum,
                'channelname': block.channelName,
                'prehash': block.preHash,
                'datahash': block.dataHash,
                'blockhash': block.blockhash,
                'txcount': block.txCount,
                'createdt': new Date(block.firstTxTimestamp)
            });

            return true;
        }

        return false;
    }

    /**
     * 保存交易，更新chaincode中交易的数量
     * @param {Object} transaction 交易对象
     */
    async saveTransaction(transaction) {
        await sql.saveRow('transaction', transaction);
        await sql.updateBySql(`update chaincodes set txcount =txcount+1 where name = '${transaction.chaincodename}' and channelname='${transaction.channelname}' `);
    }

    /**
     * 查询指定channel的最大的区块编号
     * @param {string} channelName channel名
     */
    async getCurBlockNum(channelName) {
        try {
            var row = await sql.getRowsBySQlCase(`select max(blocknum) as blocknum from blocks  where channelname='${channelName}'`);

        } catch (err) {
            logger.error(err)
            return -1;
        }

        let curBlockNum

        if (row == null || row.blocknum == null) {
            curBlockNum = -1
        } else {
            curBlockNum = parseInt(row.blocknum)
        }

        return curBlockNum
    }

    // ====================chaincodes=====================================
    /**
     * 保存chaincode
     * @param {Object} chaincode chaincode对象
     */
    async saveChaincode(chaincode) {
        let c = await sql.getRowByPkOne(`select count(1) as c from chaincodes where name='${chaincode.name}' and version='${chaincode.version}' and path='${chaincode.path}' and channelname='${chaincode.channelname}' `)
        if (c.c == 0) {
            await sql.saveRow('chaincodes', chaincode)
        }
    }

    /**
     * 保存channel
     * @param {Object} channel channel对象
     */
    async saveChannel(channel) {
        let c = await sql.getRowByPkOne(`select count(1) as c from channel where name='${channel.name}'`)
        if (c.c == 0) {
            await sql.saveRow('channel', {
                "name": channel.name,
                "createdt": channel.createdt,
                "blocks": channel.blocks,
                "trans": channel.trans,
                "channel_hash": channel.channel_hash
            })
        } else {
            await sql.updateBySql(`update channel set blocks='${channel.blocks}',trans='${channel.trans}',channel_hash='${channel.channel_hash}' where name='${channel.name}'`)
        }
    }

    /**
     * 保存peer
     * @param {Object} peer peer对象
     */
    async savePeer(peer) {
        let c = await sql.getRowByPkOne(`select count(1) as c from peer where name='${peer.name}' and requests='${peer.requests}' `)
        if (c.c == 0) {
            await sql.saveRow('peer', peer)
        }
    }

    /**
     * 查询所有channel
     */
    async getChannelsInfo() {
        var channels = await sql.getRowsBySQlNoCondtion(` select c.id as id,c.name as channelname,c.blocks as blocks ,c.trans as transactions,c.createdt as createdat,c.channel_hash as channel_hash from channel c
        group by c.id ,c.name ,c.blocks  ,c.trans ,c.createdt ,c.channel_hash order by c.name `);

        return channels
      }

    // ====================Orderer BE-303=====================================
    /**
     * 保存orderer
     * @param {Object} orderer orderer对象
     */
    async saveOrderer(orderer) {
            let c = await sql.getRowByPkOne(`select count(1) as c from orderer where requests='${orderer.requests}' `)
            if (c.c == 0) {
                await sql.saveRow('orderer', orderer)
        }
    }
    // ====================Orderer BE-303=====================================
    }

module.exports = CRUDService;