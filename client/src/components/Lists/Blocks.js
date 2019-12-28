/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from "react";
import { Container, Row, Col, Tooltip } from "reactstrap";
import Dialog, { DialogTitle } from "material-ui/Dialog";
import TransactionView from "../View/TransactionView";
import BlockView from "../View/BlockView";
import ReactTable from "react-table";
import "react-table/react-table.css";
import matchSorter from "match-sorter";
import FontAwesome from "react-fontawesome";
import find from "lodash/find";

/**
 * 区块Table
 */
class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      loading: false,
      dialogOpenBlockHash: false,
      totalBlocks: this.props.countHeader.latestBlock
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

  /**
   * 打开区块hash对应的区块详情弹框
   */
  handleDialogOpenBlockHash = rowValue => {
    const data = find(this.props.blockList, function(item) {
      return item.blockhash === rowValue;
    });
    this.setState({ dialogOpenBlockHash: true, blockHash: data });
  };

  /**
   * 关闭区块hash对应的区块详情弹框
   */
  handleDialogCloseBlockHash = () => {
    this.setState({ dialogOpenBlockHash: false });
  };

  /**
   * 点击眼睛图标，展示/收起全部的hash
   */
  handleEye = (row, val) => {
    const data = Object.assign({}, this.state.selection, { [row.index]: !val });
    this.setState({ selection: data });
  };

  componentWillReceiveProps(nextProps) { // props更新前执行
    this.setState({ totalBlocks: this.props.countHeader.latestBlock });
  }

  componentDidMount() { // 挂载后执行
    setInterval(() => {
      this.props.getBlockList(this.props.channel.currentChannel); // TODO:问题：这里为什么直接掉了异步action创建函数，该函数的返回值为一个函数(dispatch) => {Promise.resolve())？
    }, 60000);
    const selection = {};
    this.props.blockList.forEach(element => {
      selection[element.blocknum] = false;
    });
    this.setState({ selection: selection });
  }

  /**
   * 获取Table列
   */
  reactTableSetup = () => {
    return [
      {
        Header: "Block Number", // 区块编号
        accessor: "blocknum",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["blocknum"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true,
        width: 150
      },
      {
        Header: "Number of Tx", // 交易数量
        accessor: "txcount",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["txcount"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true,
        width: 150
      },
      {
        Header: "Data Hash", // hash
        accessor: "datahash",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["datahash"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: "Block Hash", // 区块hash
        accessor: "blockhash",
        Cell: row => (
          <span>
            <a
              className="hash-hide"
              onClick={() => this.handleDialogOpenBlockHash(row.value)}
              href="#/blocks"
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
              <FontAwesome name="eye" className="eyeBtn" />{" "}
            </span>
          </span>
        ),
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["blockhash"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      },
      {
        Header: "Previous Hash", // 上一个区块hash
        accessor: "prehash",
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["prehash"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true,
        width: 150
      },
      {
        Header: "Transactions", // 区块内的交易
        accessor: "txhash",
        Cell: row => (
          <ul>
            {row.value.map(tid => (
              <li
                key={tid}
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis"
                }}
              >
                <a
                  className="hash-hide"
                  onClick={() => this.handleDialogOpen(tid)}
                  href="#/blocks"
                >
                  {tid}
                </a>
              </li>
            ))}
          </ul>
        ),
        filterMethod: (filter, rows) =>
          matchSorter(
            rows,
            filter.value,
            { keys: ["txhash"] },
            { threshold: matchSorter.rankings.SIMPLEMATCH }
          ),
        filterAll: true
      }
    ];
  };

  render() {
    return (
      <div>
        <ReactTable
          data={this.props.blockList}
          columns={this.reactTableSetup()}
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
        {/** 区块详情弹框 */}
        <Dialog
          open={this.state.dialogOpenBlockHash}
          onClose={this.handleDialogCloseBlockHash}
          fullWidth={true}
          maxWidth={"md"}
        >
          <BlockView
            blockHash={this.state.blockHash}
            onClose={this.handleDialogCloseBlockHash}
          />
        </Dialog>
      </div>
    );
  }
}

export default Blocks;

