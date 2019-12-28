/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import TimeChart from './TimeChart';
import moment from 'moment-timezone';
import {
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Card,
  CardHeader,
  CardBody
} from 'reactstrap';
import {
  blocksPerHour,
  blocksPerMin,
  txPerHour,
  txPerMin
} from '../../store/actions/charts/action-creators';
import {
  getBlockperHour,
  getBlockPerMin,
  getTxPerHour,
  getTxPerMin,
  getChannel
} from '../../store/selectors/selectors';
import classnames from 'classnames';

/**
 * 区块和交易的实时统计折线图
 */
export class ChartStats extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: '1',
      loading: false
    };
    }

  componentWillReceiveProps(nextProps) { // props更新前执行
    if (nextProps.channel.currentChannel !== this.props.channel.currentChannel) {
      this.syncData(nextProps.channel.currentChannel); // 更新统计数据
    }
  }

  componentDidMount() { // 挂载后执行
    setInterval(() => { // 每6秒更新一次数据
      this.syncData(this.props.channel.currentChannel);
    }, 6000);
  }

  /**
   * 更新统计数据
   */
  syncData = currentChannel => {
    this.props.getBlocksPerMin(currentChannel);
    this.props.getBlocksPerHour(currentChannel);
    this.props.getTxPerMin(currentChannel);
    this.props.getTxPerHour(currentChannel);
  };

  /**
   * 格式化折线图需要展示的数据
   */
  timeDataSetup = (chartData = []) => {
    let displayData; // 展示数据
    let dataMax = 0; // 纵轴的最大数
    displayData = chartData.map(data => {
      if (parseInt(data.count, 10) > dataMax) {
        dataMax = parseInt(data.count, 10);
      }

      return {
        datetime: moment(data.datetime)
          .tz(moment.tz.guess())
          .format('h:mm A'), // 时间
        count: data.count // 数量
      };
    });

    dataMax = dataMax + 5;

    return {
      displayData: displayData,
      dataMax: dataMax // 纵轴的最大数
    };
  };

  toggle = tab => {
    this.setState({
      activeTab: tab
    });
  };

  render() {
    return (
      <div className="chart-stats">
        <Card>
          <CardHeader>
            <h5>Analytics</h5>
          </CardHeader>
          <CardBody>
            <Nav tabs>
              <NavItem>{ /* 每小时的区块数 */}
                <NavLink
                  className={classnames({
                    active: this.state.activeTab === "1"
                  })}
                  onClick={() => {
                    this.toggle("1");
                  }}
                >
                  BLOCKS / HOUR
                     </NavLink>
              </NavItem>
              <NavItem>{ /* 每分钟的区块数 */}
                <NavLink
                  className={classnames({
                    active: this.state.activeTab === "2"
                  })}
                  onClick={() => {
                    this.toggle("2");
                  }}
                >
                  BLOCKS / MIN
                        </NavLink>
              </NavItem>
              <NavItem>{ /* 每小时的交易数 */}
                <NavLink
                  className={classnames({
                    active: this.state.activeTab === "3"
                  })}
                  onClick={() => {
                    this.toggle("3");
                  }}
                >
                  TX / HOUR
                        </NavLink>
              </NavItem>
              <NavItem>{ /* 每分钟的交易数 */}
                <NavLink
                  className={classnames({
                    active: this.state.activeTab === "4"
                  })}
                  onClick={() => {
                    this.toggle("4");
                  }}
                >
                  TX / MIN
                        </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
              <TabPane tabId="1">{ /* 每小时的区块数 */}
                <TimeChart
                  chartData={this.timeDataSetup(this.props.blockPerHour.rows)}
                />
              </TabPane>
              <TabPane tabId="2">{ /* 每分钟的区块数 */}
                <TimeChart
                  chartData={this.timeDataSetup(this.props.blockPerMin.rows)}
                />
              </TabPane>
              <TabPane tabId="3">{ /* 每小时的交易数 */}
                <TimeChart
                  chartData={this.timeDataSetup(this.props.txPerHour.rows)}
                />
              </TabPane>
              <TabPane tabId="4">{ /* 每分钟的交易数 */}
                <TimeChart
                  chartData={this.timeDataSetup(this.props.txPerMin.rows)}
                />
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default connect(
  state => ({
    blockPerHour: getBlockperHour(state), // 每小时的区块数
    blockPerMin: getBlockPerMin(state), // 每分钟的区块数
    txPerHour: getTxPerHour(state), // 每小时的交易数
    txPerMin: getTxPerMin(state), // 每分钟的交易数
    channel: getChannel(state)
  }),
  {
    getBlocksPerHour: blocksPerHour,
    getBlocksPerMin: blocksPerMin,
    getTxPerHour: txPerHour,
    getTxPerMin: txPerMin
  }
)(ChartStats);
