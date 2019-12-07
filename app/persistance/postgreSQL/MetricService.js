/**
*    SPDX-License-Identifier: Apache-2.0
*/

var helper = require('../../helper.js');
var logger = helper.getLogger('metricservice');
var sql = require('./db/pgservice.js');

class MetricService {

    constructor() {

    }


        //==========================query counts ==========================
    /**
     * 查询指定channel上的chaincode的数量
     * @param {string} channelName channel名
     */
    getChaincodeCount(channelName) {
      return sql.getRowsBySQlCase(`select count(1) c from chaincodes where channelname='${channelName}' `)
    }

    /**
     * 查询指定channel上的peer的数量
     * @param {string} channelName channel名
     */
    getPeerlistCount(channelName) {
      return sql.getRowsBySQlCase(`select count(1) c from peer where name='${channelName}' `)
    }

    /**
     * 查询指定channel上的交易的数量
     * @param {string} channelName channel名
     */
    getTxCount(channelName) {
      return sql.getRowsBySQlCase(`select count(1) c from transaction where channelname='${channelName}'`)
    }

    /**
     * 查询指定channel上的区块的数量
     * @param {string} channelName channel名
     */
    getBlockCount(channelName) {
      return sql.getRowsBySQlCase(`select max(blocknum) c from blocks where channelname='${channelName}'`)
    }

    /**
     * 查询加入指定cahnnel的peer列表
     * @param {string} channelName channel名
     */
    async getPeerData(channelName) {
      let peerArray = []
      var c1 = await sql.getRowsBySQlNoCondtion(`select c.name as name,c.requests as requests,c.server_hostname as server_hostname from peer c where c.name='${channelName}'`);
      for (var i = 0, len = c1.length; i < len; i++) {
        var item = c1[i];
        peerArray.push({ 'name': item.channelname, 'requests': item.requests, 'server_hostname': item.server_hostname })
      }
      return peerArray
    }
//BE -303
  /**
   * 获取所有orderer
   */
	async getOrdererData() {
      let ordererArray = []
      var c1 = await sql.getRowsBySQlNoCondtion(`select c.requests as requests,c.server_hostname as server_hostname from orderer c`);
      for (var i = 0, len = c1.length; i < len; i++) {
        var item = c1[i];
        ordererArray.push({  'requests': item.requests, 'server_hostname': item.server_hostname })
      }
      return ordererArray
    }
//BE -303
    /**
     * 查询指定channel上的每一个chaincode的交易数量
     * @param {string} channelName channel名
     */
    async getTxPerChaincodeGenerate(channelName) {
      let txArray = []
      var c = await sql.getRowsBySQlNoCondtion(`select c.channelname as channelname,c.name as chaincodename,c.version as version,c.path as path ,txcount  as c from chaincodes c where  c.channelname='${channelName}' `);
      //console.log("chaincode---" + c)
      if (c) {
        c.forEach((item, index) => {
          txArray.push({ 'channelName': item.channelname, 'chaincodename': item.chaincodename, 'path': item.path, 'version': item.version, 'txCount': item.c })
        })
      }
      return txArray

    }

    /**
     * 查询指定channel上的每一个chaincode的交易数量
     * @param {string} channelName channel名
     * @param {function} cb 回调函数
     */
    async getTxPerChaincode(channelName, cb) {
      try {
        var txArray = await this.getTxPerChaincodeGenerate(channelName);
        cb(txArray);
      } catch(err) {
        logger.error(err)
        cb([])
      }
    }

    /**
     * 查询指定channel的统计数据，包括chaincode、交易、区块、peer的数量
     * @param {strign} channelName channel名
     */
    async getStatusGenerate(channelName) {
      var chaincodeCount = await this.getChaincodeCount(channelName)
      if (!chaincodeCount) chaincodeCount = 0
      var txCount = await this.getTxCount(channelName)
      if (!txCount) txCount = 0
      var blockCount = await this.getBlockCount(channelName)
      if (!blockCount) blockCount = 0
      blockCount.c = blockCount.c ? blockCount.c : 0
      var peerCount = await this.getPeerlistCount(channelName)
      if (!peerCount) peerCount = 0
      peerCount.c = peerCount.c ? peerCount.c : 0
      return { 'chaincodeCount': chaincodeCount.c, 'txCount': txCount.c, 'latestBlock': blockCount.c, 'peerCount': peerCount.c }
    }

    /**
     * 查询指定channel的统计数据，包括chaincode、交易、区块、peer的数量
     * @param {strign} channelName channel名
     * @param {function} cb 回调函数
     */
    async getStatus(channelName, cb) {

      try {
          var data = await this.getStatusGenerate(channelName);
          cb(data);
      } catch(err) {
        logger.error(err)
      }

    }

    /**
     * 查询加入指定cahnnel的peer列表
     * @param {string} channelName channel名
     * @param {function} cb 回调函数
     */
    async getPeerList(channelName, cb) {
      try {
          var peerArray = await this.getPeerData(channelName);
          cb(peerArray)
      } catch(err) {
        logger.error(err)
        cb([])
      }
    }
  //BE -303
  /**
   * 获取所有orderer
   * @param {function} cb 回调函数
   */
	async getOrdererList(cb) {
      try {
          var ordererArray = await this.getOrdererData();
          cb(ordererArray)
      } catch(err) {
        logger.error(err)
        cb([])
      }
    }
//BE -303
    //transaction metrics

    /**
     * 查询现在时间之前的几小时的每分钟产生的交易数量
     * @param {string} channelName channel名
     * @param {number} hours 现在之前的几小时
     */
    getTxByMinute(channelName, hours) {
      let sqlPerMinute = ` with minutes as (
            select generate_series(
              date_trunc('min', now()) - '${hours}hour'::interval,
              date_trunc('min', now()),
              '1 min'::interval
            ) as datetime
          )
          select
            minutes.datetime,
            count(createdt)
          from minutes
          left join TRANSACTION on date_trunc('min', TRANSACTION.createdt) = minutes.datetime and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerMinute);
    }

    /**
     * 查询现在时间之前的几天的每小时产生的交易数量
     * @param {string} channelName channel名
     * @param {number} days 现在之前的几天
     */
    getTxByHour(channelName, day) {
      let sqlPerHour = ` with hours as (
            select generate_series(
              date_trunc('hour', now()) - '${day}day'::interval,
              date_trunc('hour', now()),
              '1 hour'::interval
            ) as datetime
          )
          select
            hours.datetime,
            count(createdt)
          from hours
          left join TRANSACTION on date_trunc('hour', TRANSACTION.createdt) = hours.datetime and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerHour);
    }

    /**
     * 查询现在时间之前的几天的每天产生的交易数量
     * @param {string} channelName channel名
     * @param {number} days 现在之前的几天
     */
    getTxByDay(channelName, days) {
      let sqlPerDay = ` with days as (
            select generate_series(
              date_trunc('day', now()) - '${days}day'::interval,
              date_trunc('day', now()),
              '1 day'::interval
            ) as datetime
          )
          select
            days.datetime,
            count(createdt)
          from days
          left join TRANSACTION on date_trunc('day', TRANSACTION.createdt) =days.datetime and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerDay);
    }

    /**
     * 查询现在时间之前的几周的每周产生的交易数量
     * @param {string} channelName channel名
     * @param {number} weeks 现在之前的几周
     */
    getTxByWeek(channelName, weeks) {
      let sqlPerWeek = ` with weeks as (
            select generate_series(
              date_trunc('week', now()) - '${weeks}week'::interval,
              date_trunc('week', now()),
              '1 week'::interval
            ) as datetime
          )
          select
            weeks.datetime,
            count(createdt)
          from weeks
          left join TRANSACTION on date_trunc('week', TRANSACTION.createdt) =weeks.datetime and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerWeek);
    }

    /**
     * 查询现在时间之前的几个月的每月产生的交易数量
     * @param {string} channelName channel名
     * @param {number} months 现在之前的几个月
     */
    getTxByMonth(channelName, months) {
      let sqlPerMonth = ` with months as (
            select generate_series(
              date_trunc('month', now()) - '${months}month'::interval,
              date_trunc('month', now()),
              '1 month'::interval
            ) as datetime
          )

          select
            months.datetime,
            count(createdt)
          from months
          left join TRANSACTION on date_trunc('month', TRANSACTION.createdt) =months.datetime  and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerMonth);
    }

    /**
     * 查询现在时间之前的几年的每年产生的交易数量
     * @param {string} channelName channel名
     * @param {number} years 现在之前的几年
     */
    getTxByYear(channelName, years) {
      let sqlPerYear = ` with years as (
            select generate_series(
              date_trunc('year', now()) - '${years}year'::interval,
              date_trunc('year', now()),
              '1 year'::interval
            ) as year
          )
          select
            years.year,
            count(createdt)
          from years
          left join TRANSACTION on date_trunc('year', TRANSACTION.createdt) =years.year and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerYear);
    }

    // block metrics API
    /**
     * 查询现在时间之前的几小时的每分钟产生的区块数量
     * @param {string} channelName channel名
     * @param {number} hours 现在之前的几小时
     */
    getBlocksByMinute(channelName, hours) {
      let sqlPerMinute = ` with minutes as (
            select generate_series(
              date_trunc('min', now()) - '${hours} hour'::interval,
              date_trunc('min', now()),
              '1 min'::interval
            ) as datetime
          )
          select
            minutes.datetime,
            count(createdt)
          from minutes
          left join BLOCKS on date_trunc('min', BLOCKS.createdt) = minutes.datetime and channelname ='${channelName}'
          group by 1
          order by 1  `;

      return sql.getRowsBySQlQuery(sqlPerMinute);
    }

    /**
     * 查询现在时间之前的几天的每小时产生的区块数量
     * @param {string} channelName channel名
     * @param {number} days 现在之前的几天
     */
    getBlocksByHour(channelName, days) {
      let sqlPerHour = ` with hours as (
            select generate_series(
              date_trunc('hour', now()) - '${days}day'::interval,
              date_trunc('hour', now()),
              '1 hour'::interval
            ) as datetime
          )
          select
            hours.datetime,
            count(createdt)
          from hours
          left join BLOCKS on date_trunc('hour', BLOCKS.createdt) = hours.datetime and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerHour);
    }

    /**
     * 查询现在时间之前的几天的每天产生的区块数量
     * @param {string} channelName channel名
     * @param {number} days 现在之前的几天
     */
    getBlocksByDay(channelName, days) {
      let sqlPerDay = `  with days as (
            select generate_series(
              date_trunc('day', now()) - '${days}day'::interval,
              date_trunc('day', now()),
              '1 day'::interval
            ) as datetime
          )
          select
            days.datetime,
            count(createdt)
          from days
          left join BLOCKS on date_trunc('day', BLOCKS.createdt) =days.datetime and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerDay);
    }

    /**
     * 查询现在时间之前的几周的每周产生的区块数量
     * @param {string} channelName channel名
     * @param {number} weeks 现在之前的几周
     */
    getBlocksByWeek(channelName, weeks) {
      let sqlPerWeek = ` with weeks as (
            select generate_series(
              date_trunc('week', now()) - '${weeks}week'::interval,
              date_trunc('week', now()),
              '1 week'::interval
            ) as datetime
          )
          select
            weeks.datetime,
            count(createdt)
          from weeks
          left join BLOCKS on date_trunc('week', BLOCKS.createdt) =weeks.datetime and channelname ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerWeek);
    }

    /**
     * 查询现在时间之前的几个月的每月产生的区块数量
     * @param {string} channelName channel名
     * @param {number} months 现在之前的几个月
     */
    getBlocksByMonth(channelName, months) {
      let sqlPerMonth = `  with months as (
            select generate_series(
              date_trunc('month', now()) - '${months}month'::interval,
              date_trunc('month', now()),
              '1 month'::interval
            ) as datetime
          )
          select
            months.datetime,
            count(createdt)
          from months
          left join BLOCKS on date_trunc('month', BLOCKS.createdt) =months.datetime and channelname  ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerMonth);
    }

    /**
     * 查询现在时间之前的几年的每年产生的区块数量
     * @param {string} channelName channel名
     * @param {number} years 现在之前的几年
     */
    getBlocksByYear(channelName, years) {
      let sqlPerYear = ` with years as (
            select generate_series(
              date_trunc('year', now()) - '${years}year'::interval,
              date_trunc('year', now()),
              '1 year'::interval
            ) as year
          )
          select
            years.year,
            count(createdt)
          from years
          left join BLOCKS on date_trunc('year', BLOCKS.createdt) =years.year and channelname  ='${channelName}'
          group by 1
          order by 1 `;

      return sql.getRowsBySQlQuery(sqlPerYear);
    }

    /**
     * 查询指定channel的各组织的交易数量
     * @param {string} channelName channel名
     */
    getTxByOrgs(channelName) {
      let sqlPerOrg = ` select count(creator_msp_id), creator_msp_id
      from transaction
      where channelname ='${channelName}'
      group by  creator_msp_id`;

      return sql.getRowsBySQlQuery(sqlPerOrg);
    }


}

module.exports = MetricService;