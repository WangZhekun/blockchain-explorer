/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import beautify from 'js-beautify'; // js代码格式化，反压缩

const styles = theme => ({
  container: {
    border: '3px solid #afeeee'
  },
  container1: {
    display: 'flex',
    flexWrap: 'wrap'
  }
});

/**
 * 展示chaincode内容
 */
export class ChaincodeModal extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const formattedSrc = beautify(this.props.chaincode.source, { indent_size: 4 }); // 格式化chaincode
    const srcHeader = this.props.chaincode.chaincodename + " " + this.props.chaincode.version;
    const { classes } = this.props;

    return (
      <div className={["card", classes.container].join(" ")} >
        <div className="card-header" align="center">
          <h3> {srcHeader}</h3>
        </div>
        <div className="card-body">
          <div className={classes.container1}>
            <lable className="source-code" readOnly>
              {formattedSrc}
            </lable>
          </div>
        </div>
      </div >
    );
  }
}

ChaincodeModal.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ChaincodeModal);
