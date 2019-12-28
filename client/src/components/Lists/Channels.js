/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import matchSorter from 'match-sorter';

/**
 * channel列表
 */
class Channels extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() { // 挂载前，更新数据
   this.props.getChannels()
  }

  componentDidMount() { // 挂载后执行
    setInterval(() => { // 每6小时同步数据
      this.props.getChannels()
    }, 600000);
  }

  /**
   * 返回Table列
   */
  reactTableSetup = () => {
    return [
      {
        Header: 'ID', // channelID
        accessor: 'id',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['id'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true,
        width: 100
      },
      {
        Header: 'Channel Name', // channel名称
        accessor: 'channelname',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['channelname'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: 'Channel Hash', // channel hash
        accessor: 'channel_hash',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['channel_hash'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: 'Blocks', // 区块数
        accessor: 'blocks',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['blocks'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true,
        width: 125
      }, {
        Header: 'Transactions', // 交易数
        accessor: 'transactions',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['transactions'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true,
        width: 125
      },
      {
        Header: 'Timestamp', // 时间戳（channel创建时间）
        accessor: 'createdat',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['createdat'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      }
    ];
  };

  render() {
    return (
      <div className="blockPage">
        <ReactTable
          data={this.props.channels}
          columns={this.reactTableSetup()}
          defaultPageSize={5}
          className="-striped -highlight"
          filterable
          minRows={0}
        />
      </div>
    );
  }
}

export default Channels;
