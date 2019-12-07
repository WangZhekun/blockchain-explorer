/**
 *    SPDX-License-Identifier: Apache-2.0
 */
var config = require("./config.json");
var helper = require("../../helper.js");
var logger = helper.getLogger("FabricConfiguration");

var defaultOrg;
var defaultPeer;
var currChannel;

/**
 * fabric-client的配置类
 */
class Configuration { 
  constructor(config) {
    this.networkConfig = config["network-config"]; // 所有的组织的配置
  }

  /**
   * 获取默认组织，即配置中的network-config项的第一个组织
   */
  getDefaultOrg() {
    if (defaultOrg == undefined) {
      defaultOrg = Object.keys(this.networkConfig)[0];
    }

    return defaultOrg;
  }

  /**
   * 获取默认peer的配置对象，即默认组织的peer1的配置对象
   */
  getDefaultPeer() {
    if (defaultPeer == undefined) {
      var org = this.getDefaultOrg();
      var orgObj = config["network-config"][org];
      var orgKey = Object.keys(orgObj);
      var index = orgKey.indexOf("peer1");
      defaultPeer = orgKey[index];
    }

    return defaultPeer;
  }

  /**
   * 获取指定组织的配置项
   * @param {string} org 组织名
   */
  getOrg(org) {
    return this.networkConfig[org];
  }

  /**
   * 获取指定组织的name属性
   * @param {string} org 组织名
   */
  getOrgName(org) {
    return this.networkConfig[org].name;
  }

  /**
   * 获取指定组织的admin用户的配置对象
   * @param {string} org 组织名
   */
  getOrgAdmin(org) {
    this.networkConfig[org].admin;
  }

  /**
   * 获取KeyValueStore目录地址
   * @param {string} org 组织名
   */
  getKeyStoreForOrg(org) {
    return config.keyValueStore + "_" + org;
  }

  /**
   * 获取指定组织的mspid
   * @param {string} org 组织名
   */
  getMspID(org) {
    logger.debug("Msp ID : " + this.networkConfig[org].mspid);
    return this.networkConfig[org].mspid;
  }

  /**
   * 获取指定组织指定peer的请求地址
   * @param {string} org 组织名
   * @param {string} peer peer名
   */
  getPeerAddressByName(org, peer) {
    var address = this.networkConfig[org][peer].requests;
    return address;
  }

  /**
   * 获取组织名列表
   */
  getOrgs() {
    let orgList = [];
    for (let key in this.networkConfig) {
      if (key.indexOf("org") === 0) {
        orgList.push(key);
      }
    }
    return orgList;
  }

  /**
   * 获取指定组织的peer名列表
   * @param {string} org 组织名
   */
  getPeersByOrg(org) {
    let peerList = [];
    for (let key in this.networkConfig[org]) {
      if (key.indexOf("peer") === 0) {
        peerList.push(key);
      }
    }
    return peerList;
  }

  //BE -303
  /**
   * 获取orderer配置列表
   */
  getOrderersByOrg() {
    return config.orderers;
  }

  //BE -303
  /**
   * 获取所有组织和peer配置的对应关系（列表）
   */
  getOrgMapFromConfig() {
    var orgs = Object.keys(this.networkConfig);
    var peerlist = [];
    orgs.forEach(ele => { // 遍历组织
      var org = this.networkConfig[ele]; // 组织
      var properties = Object.keys(org); // 组织的各配置项
      properties.forEach(prop => { // 遍历组织的各配置项
        if (
          typeof org[prop] === "object" &&
          "requests" in org[prop] &&
          "events" in org[prop] &&
          "server-hostname" in org[prop] &&
          "tls_cacerts" in org[prop]
        ) // 如果该配置项为peer的配置
          peerlist.push({
            key: ele,
            value: prop
          });
      });
    });
    return peerlist;
  }

  /**
   * 获取当前channel名
   */
  getCurrChannel() {
    if (currChannel == undefined) currChannel = config.channel;
    return currChannel;
  }

  /**
   * 修改当前channel名
   * @param {string} channelName channel名
   */
  changeChannel(channelName) {
    currChannel = channelName;
  }
}

module.exports = new Configuration(config);
