/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { Container, Row, Col, Button } from 'reactstrap';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import matchSorter from 'match-sorter';
import Dialog from 'material-ui/Dialog';
import ChaincodeForm from '../Forms/ChaincodeForm';
import ChaincodeModal from '../View/ChaincodeModal';

/**
 * chaincode列表
 */
class Chaincodes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      chaincodeCount: this.props.countHeader.chaincodeCount,
      dialogOpen: false,
      sourceDialog: false,
      chaincode: {}
    };
  }

  componentWillReceiveProps(nextProps) { // props更新前执行
    this.setState({ chaincodeCount: this.props.countHeader.chaincodeCount });
  }

  componentDidMount() { // 挂载后执行
    setInterval(() => {
      this.props.getChaincodes(this.props.channel.currentChannel);
    }, 60000);
  }

  /**
   * 打开新增chaincode的表单弹框
   */
  handleDialogOpen = () => {
    this.setState({ dialogOpen: true });
  };

  /**
   * 关闭新增chaincode的表单弹框
   */
  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  /**
   * 打开chaincode详情弹框
   */
  sourceDialogOpen = chaincode => {
    this.setState({ chaincode: chaincode });
    this.setState({ sourceDialog: true });
  };

  /**
   * 关闭chaincode详情弹框
   */
  sourceDialogClose = () => {
    this.setState({ sourceDialog: false });
  };

  /**
   * 获取Table列
   */
  reactTableSetup = () => {
    return [
      {
        Header: 'Chaincode Name', // Chaincode名称列
        accessor: 'chaincodename',
        Cell: row => (
          <a className="hash-hide" onClick={() => this.sourceDialogOpen(row.original)} href="#/chaincodes" >{row.value}</a>
        ),
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['chaincodename'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: 'Channel Name', // channel名称列
        accessor: 'channelName',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['channelName'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: 'Path', // chaincode文件地址
        accessor: 'path',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['path'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: 'Transaction Count', // 交易数量
        accessor: 'txCount',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['txCount'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: 'Version', // chaincode版本
        accessor: 'version',
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ['version'] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      }
    ];
  };

  render() {
    return (
      <div >
        <Button className="button" onClick={() => this.handleDialogOpen()}>
          Add Chaincode
        </Button>
        <ReactTable
          data={this.props.chaincodes}
          columns={this.reactTableSetup()}
          defaultPageSize={5}
          className="-striped -highlight"
          filterable
          minRows={0}
        />
      {/** 新增chaincode的表单弹框 */}
      <Dialog
        open={this.state.dialogOpen}
        onClose={this.handleDialogClose}
        fullWidth={true}
        maxWidth={"md"}
      >
        <ChaincodeForm />
      </Dialog>
      {/** chaincode详情弹框 */}
      <Dialog
        open={this.state.sourceDialog}
        onClose={this.sourceDialogClose}
        fullWidth={true}
        maxWidth={"md"}
      >
        <ChaincodeModal chaincode={this.state.chaincode} />
      </Dialog>
      </div >
    );
  }
}

export default Chaincodes;
