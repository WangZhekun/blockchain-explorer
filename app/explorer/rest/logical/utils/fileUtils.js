/*
    SPDX-License-Identifier: Apache-2.0
*/

var path = require('path');
var fs = require('fs');
var sha = require('js-sha256'); // sha256加密库
var asn = require('asn1.js'); // BER ASN.1解码器

/**
 * 在/tmp目录创建以时间戳命名的临时目录
 */
var generateDir = async function () {
    var tempDir = '/tmp/' + new Date().getTime();
    try {
        fs.mkdirSync(tempDir);
    } catch (err) {
        logger.error(err);
    }
    return tempDir
}

/**
 * 根据区块信息生成hash值
 * TODO：问题：这里涉及的asn1.js不是很明白？
 * @param {Object} header 区块的头信息，包括区块编号、上一个区块的hash，数据区的hash
 */
var generateBlockHash = async function (header) {
    let headerAsn = asn.define('headerAsn', function () {
        this.seq().obj(this.key('Number').int(),
            this.key('PreviousHash').octstr(), this.key('DataHash').octstr());
    });
    let output = headerAsn.encode({
        Number: parseInt(header.number),
        PreviousHash: Buffer.from(header.previous_hash, 'hex'),
        DataHash: Buffer.from(header.data_hash, 'hex')
    }, 'der');
    return sha.sha256(output);
}


exports.generateDir = generateDir;
exports.generateBlockHash = generateBlockHash;