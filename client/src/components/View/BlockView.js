/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import FontAwesome from "react-fontawesome";
import { CopyToClipboard } from "react-copy-to-clipboard";
import moment from "moment-timezone";
import {
  Table,
  Card,
  CardText,
  CardBody,
  CardTitle,
  CardSubtitle,
  Button
} from "reactstrap";

const blockIcon = {
  color: "#79c879",
  margin: "20px"
};
const copyIcon = {
  color: "#OB34D5",
  float: "right",
  margin: "10px"
};

/**
 * 区块详情
 */
class BlockView extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { // TODO: loading没用
      loading: false
    };
  }

  componentWillReceiveProps(nextProps) { // props更新前执行
    this.setState({ loading: false });
  }

  /**
   * 关闭
   */
  handleClose = () => {
    this.props.onClose();
  };

  render() {
    const { classes, blockHash } = this.props;
    if (!blockHash) { // 区块hash为空
      return (
        <div>
          <Card>
            <CardTitle className="dialogTitle">
              <FontAwesome name="cube" />Block Details
            </CardTitle>
            <CardBody>
              <span className="loading-wheel">
                {" "}
                <FontAwesome name="circle-o-notch" size="3x" spin />
              </span>
            </CardBody>
          </Card>
        </div>
      );
    } else {
      return (
        <div className="dialog">
          <Card>
            <CardTitle className="dialogTitle">
              <FontAwesome name="cube" className="cubeIcon" />Block Details
              <button onClick={this.handleClose} className="closeBtn">
                <FontAwesome name="close" />
              </button>
            </CardTitle>
            <CardBody>
              <Table striped hover responsive className="table-striped">
                <tbody>
                  <tr>
                    <th>Channel name:</th>{/** channel名称 */}
                    <td>{blockHash.channelname}</td>
                  </tr>
                  <tr>
                    <th>ID</th>{/** 区块hash的id */}
                    <td>{blockHash.id}</td>
                  </tr>
                  <tr>
                    <th>Block Number</th>{/** 区块编号 */}
                    <td>{blockHash.blocknum}</td>
                  </tr>
                  <tr>
                    <th>Created at</th>{/** 区块创建时间 */}
                    <td>{blockHash.createdt}</td>
                  </tr>

                  <tr>
                    <th>Number of Transactions</th>{/** 区块的交易数 */}
                    <td>{blockHash.txcount}</td>
                  </tr>
                  <tr>
                    <th>Block Hash</th>{/** 区块hash */}
                    <td>
                      {blockHash.blockhash}
                      <button className="copyBtn">
                        <CopyToClipboard text={blockHash.blockhash}>
                          <FontAwesome name="copy" />
                        </CopyToClipboard>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>Data Hash</th>{/** 数据hash */}
                    <td>
                      {blockHash.datahash}
                      <button className="copyBtn">
                        <CopyToClipboard text={blockHash.blockhash}>
                          <FontAwesome name="copy" />
                        </CopyToClipboard>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>Prehash</th>{/** 上一个区块hash */}
                    <td>
                      {blockHash.prehash}
                      <button className="copyBtn">
                        <CopyToClipboard text={blockHash.blockhash}>
                          <FontAwesome name="copy" />
                        </CopyToClipboard>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </div>
      );
    }
  }
}

export default BlockView;
