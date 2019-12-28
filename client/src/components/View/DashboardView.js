/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import ChartStats from '../Charts/ChartStats';
import PeersHealth from '../Lists/PeersHealth';
import TimelineStream from '../Lists/TimelineStream';
import OrgPieChart from '../Charts/OrgPieChart';
import {
  Card,
  Row,
  Col,
  CardBody
} from 'reactstrap';
import FontAwesome from 'react-fontawesome';

/**
 * 仪表盘，展示统计数据
 */
export class DashboardView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notifications: []
    }
  }

  componentWillReceiveProps(nextProps) { // 该生命周期使用至React 17，已挂载的组件接收新的 props 之前被调用
    if (Object.keys(nextProps.notification).length !== 0 && this.props.notification !== nextProps.notification) {
      let arr = this.state.notifications;
      arr.unshift(nextProps.notification);
      this.setState({ notifications: arr });
    }
    if (nextProps.channel.currentChannel !== this.props.channel.currentChannel) {
      this.props.getTxByOrg(nextProps.channel.currentChannel);
    }
  }

  componentDidMount() { // 组件挂载后（插入 DOM 树中）立即调用
    setInterval(() => {
      this.props.getTxByOrg(this.props.channel.currentChannel);
      this.props.getCountHeader(this.props.channel.currentChannel);
    }, 3000);

    this.setNotifications(this.props.blockList) // 更新notifications
  }

  /**
   * 更新notifications
   * 按照react的文档，notifications可以放到 Render 中处理，而非放在state
   */
  setNotifications = (blockList) => {
    let notificationsArr = [];
    if (blockList !== undefined) {
      for (let i = 0; i < 3 && this.props.blockList && this.props.blockList[i]; i++) {
        const block = this.props.blockList[i];
        const notify = {
          'title': `Block ${block.blocknum} Added`,
          'type': 'block',
          'time': block.createdt,
          'txcount': block.txcount,
          'datahash': block.datahash
        };
        notificationsArr.push(notify);
      }
    }
    this.setState({ notifications: notificationsArr });
  }

  render() {
    return (
      <div className="view-fullwidth" >
        <div className="dashboard" >
          <div className="dash-stats">
            <Row>{ /* 区块、交易、节点、chaincode的统计数据 */ }
              <Card className="count-card dark-card">
                <CardBody>
                  <h1>{this.props.countHeader.latestBlock}</h1>
                  <h4> <FontAwesome name="cube" /> Blocks</h4>
                </CardBody>
              </Card>
              <Card className="count-card light-card" >
                <CardBody>
                  <h1>{this.props.countHeader.txCount}</h1>
                  <h4><FontAwesome name="list-alt" /> Transactions</h4>
                </CardBody>
              </Card>
              <Card className="count-card dark-card" >
                <CardBody>
                  <h1>{this.props.countHeader.peerCount}</h1>
                  <h4><FontAwesome name="users" />Nodes</h4>
                </CardBody>
              </Card>
              <Card className="count-card light-card" >
                <CardBody>
                  <h1>{this.props.countHeader.chaincodeCount}</h1>
                  <h4><FontAwesome name="handshake-o" />Chaincodes</h4>
                </CardBody>
              </Card>
            </Row>
          </div>
          <Row>{ /* 分析、组织、动态、peer的图表 */ }
            <Col lg="6">
              <ChartStats />{ /** 区块和交易的实时统计折线图 */}
            </Col>
            <Col lg="6">
              <OrgPieChart txByOrg={this.props.txByOrg} />{ /** 各组织的交易占比饼图 */}
            </Col>
          </Row>
          <Row className="lower-dash">
            <Col lg="6">
              <TimelineStream notifications={this.state.notifications} />{ /** 区块创建动态图 */}
            </Col>
            <Col lg="6">
              <PeersHealth peerStatus={this.props.peerStatus} channel={this.props.channel.currentChannel} />{ /** peer节点状态表 */}
            </Col>
          </Row>
        </div >
      </div>
    );
  }
}

export default DashboardView
