/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from "react";
import { Container, Row, Col } from "reactstrap";
import Dialog, { DialogTitle } from "material-ui/Dialog";
import TransactionView from "../View/TransactionView";
import FontAwesome from "react-fontawesome";
import ReactTable from "react-table";
import "react-table/react-table.css";
import matchSorter from "match-sorter";

/**
 * 交易列表
 */
class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      totalTransactions: this.props.countHeader.txCount,
      dialogOpen: false
    };
  }

  /**
   * 打开交易详情弹框
   */
  handleDialogOpen = tid => {
    this.props.getTransactionInfo(this.props.channel.currentChannel, tid);
    this.setState({ dialogOpen: true });
  };

  /**
   * 关闭交易详情弹框
   */
  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  componentWillReceiveProps(nextProps) { // props更新前执行
    this.setState({ totalTransactions: this.props.countHeader.txCount });
  }

  /** 
   * 点击眼睛图标，展示/收起全部的交易ID
   */
  handleEye = (row, val) => {
    const data = Object.assign({}, this.state.selection, { [row.index]: !val });
    this.setState({ selection: data });
  };

  componentDidMount() { // 挂载后执行
    const selection = {};
    this.props.transactionList.forEach(element => {
      selection[element.blocknum] = false;
    });
    this.setState({ selection: selection });
  }

  render() {
    const columnHeaders = [ // Table列
      {
        Header: "Creator", // 创建者
        accessor: "creator_msp_id",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["creator_msp_id"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: "Tx Id", // 交易ID
        accessor: "txhash",
        Cell: row => (
          <span>
            <a
              onClick={() => this.handleDialogOpen(row.value)}
              href="#/transactions"
            >
              {" "}
              {this.state.selection && this.state.selection[row.index]
                ? row.value
                : row.value.slice(0, 6)}{" "}
            </a>
            <span
              onClick={() =>
                this.handleEye(row, this.state.selection[row.index])
              }
            >
              {row.value && <FontAwesome name="eye" className="eyeBtn" />}
            </span>
          </span>
        ),
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["txhash"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: "Type", // 交易类型
        accessor: "type",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["type"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: "Chaincode", // chaincode名称
        accessor: "chaincodename",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["chaincodename"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: "Timestamp", // 时间戳
        accessor: "createdt",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["createdt"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      }
    ];

    return (
      <div>
        <ReactTable
          data={this.props.transactionList}
          columns={columnHeaders}
          defaultPageSize={10}
          className="-striped -highlight"
          filterable
          minRows={0}
        />
        {/** 交易详情弹框 */}
        <Dialog
          open={this.state.dialogOpen}
          onClose={this.handleDialogClose}
          fullWidth={true}
          maxWidth={"md"}
        >
          <TransactionView
            transaction={this.props.transaction}
            onClose={this.handleDialogClose}
          />
        </Dialog>
      </div>
    );
  }
}

export default Transactions;

