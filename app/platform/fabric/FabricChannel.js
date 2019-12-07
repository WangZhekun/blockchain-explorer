/**
*    SPDX-License-Identifier: Apache-2.0
*/

var co = require('co');

/**
 * channel和对应的ChannelEventHub的集合
 */
class FabricChannel {

    constructor(channelName, channel, channelEventHub) {
        this.channelName = channelName; // channel名
        this.channel = channel; // channel实例
        this.channelEventHub = channelEventHub; // ChannelEventHub实例
    }

    /**
     * 获取加入到channel的所有Peer
     */
    getPeers() {
        return channel.getPeers();
    }

}

module.exports = FabricChannel;