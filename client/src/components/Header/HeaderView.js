/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import 'react-select/dist/react-select.css';
import React, { Component } from 'react';
import compose from 'recompose/compose';
import { connect } from 'react-redux';
import { withStyles } from 'material-ui/styles';
import Select from 'react-select';
import {
  Nav,
  Navbar,
  NavbarBrand,
  NavbarToggler
} from 'reactstrap';
import AdminPanel from '../Panels/AdminPanel';
import Logo from '../../static/images/Explorer_Logo.svg';
import FontAwesome from 'react-fontawesome';
import Drawer from 'material-ui/Drawer';
import Button from 'material-ui/Button';
import NotificationsPanel from '../Panels/NotificationsPanel';
import Websocket from 'react-websocket';
import Badge from 'material-ui/Badge';
import { notification } from '../../store/actions/notification/action-creators';
import { changeChannel } from '../../store/actions/channel/action-creators';
import {
  getChannelList,
  getChannel,
  getNotification
} from '../../store/selectors/selectors'

const styles = theme => ({
  margin: {
    margin: theme.spacing.unit,
  },
  padding: {
    padding: `0 ${theme.spacing.unit * 2}px`,
  },
});


/**
 * 页面header部分，包含logo、菜单、消息、设置等板块
 */
export class HeaderView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      notifyDrawer: false,
      adminDrawer: false,
      channels: [],
      notifyCount: 0,
      notifications: [],
      modalOpen: false
    }
  }

  /**
   * 展开/收起菜单
   */
  toggle = () => {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  /**
   * 刷新数据
   * @param {Object} notification 消息
   */
  handleData(notification) {
    this.props.getNotification(notification);
    let notifyArr = this.state.notifications;
    notifyArr.unshift(JSON.parse(notification));
    this.setState({ notifications: notifyArr });
    this.setState({ notifyCount: this.state.notifyCount + 1 });
  }

  componentDidMount() { // 挂载后执行
    let arr = [];
    this.props.channelList.channels.forEach(element => {
      arr.push({
        value: element,
        label: element
      })
    });

    this.setState({ channels: arr });
    this.setState({ selectedOption: this.props.channel.currentChannel })
  }

  /**
   * 修改当前channel
   */
  handleChange = (selectedOption) => {
    this.setState({ selectedOption: selectedOption.value });
    this.props.getChangeChannel(selectedOption.value);
  }

  handleOpen = () => {
    this.setState({ modalOpen: true });
  }

  handleClose = () => {
    this.setState({ modalOpen: false });
  }

  /**
   * 打开抽屉
   */
  handleDrawOpen = (drawer) => {
    switch (drawer) {
      case 'notifyDrawer': { // 消息抽屉
        this.setState({ notifyDrawer: true });
        this.setState({ notifyCount: 0 });
        break;
      }
      case 'adminDrawer': { // 设置操作抽屉
        this.setState({ adminDrawer: true });
        break;
      }
      default: {
        break;
      }
    }
  }

  /**
   * 关闭抽屉
   */
  handleDrawClose = (drawer) => {
    switch (drawer) {
      case 'notifyDrawer': { // 消息抽屉
      this.setState({ notifyDrawer: false });
        break;
      }
      case 'adminDrawer': { // 设置操作抽屉
        this.setState({ adminDrawer: false });
        break;
      }
      default: {
        break;
      }
    }
  }

  render() {
    const { classes } = this.props;
    const { hostname, port } = window.location;
    var webSocketUrl = `ws://${hostname}:${port}/`;

    return (
      <div>
        {/* production */}
        {/* development */}
        <Websocket url={webSocketUrl}
          onMessage={this.handleData.bind(this)} reconnect={true} />
        <Navbar color="light" light expand="md" fixed="top">
          <NavbarBrand href="/"> <img src={Logo} className="logo" alt="Hyperledger Logo" /></NavbarBrand>
          <NavbarToggler onClick={this.toggle} /> {/* 宽度小于768px的小屏幕右侧的菜单列表图标 TODO：这个功能实现有问题，菜单一直展示 */}
          <Nav className="ml-auto" navbar>{/* 菜单 */}
            <Button href="/#" className={classes.margin} >DASHBOARD</Button>
            <Button href="#/network" className={classes.margin} >NETWORK</Button>
            <Button href="#/blocks" className={classes.margin} >BLOCKS</Button>
            <Button href="#/transactions" className={classes.margin} >TRANSACTIONS</Button>
            <Button href="#/chaincodes" className={classes.margin} >CHAINCODES</Button>
            <Button href="#/channels" className={classes.margin} >CHANNELS</Button>
            <div className="channel-dropdown">
              <Select
                placeholder="Select Channel..."
                required={true}
                name="form-field-name"
                value={this.state.selectedOption}
                onChange={this.handleChange}
                options={this.state.channels} />
            </div>
            <div className="admin-buttons"> {/* 消息通知按钮 */}
              <FontAwesome name="bell" className="bell" onClick={() => this.handleDrawOpen("notifyDrawer")} />
              <Badge className={classes.margin} badgeContent={this.state.notifyCount} color="primary"></Badge>
            </div>
            <div className="admin-buttons"> {/* 设置操作按钮 */}
              <FontAwesome name="cog" className="cog" onClick={() => this.handleDrawOpen("adminDrawer")} />
            </div>
          </Nav>
        </Navbar>
        {/* 消息抽屉 */}
        <Drawer anchor="right" open={this.state.notifyDrawer} onClose={() => this.handleDrawClose("notifyDrawer")}>
          <div
            tabIndex={0}
            role="button" >
            <NotificationsPanel notifications={this.state.notifications} /> {/* 消息面板 */}
          </div>
        </Drawer>
        {/* 设置操作抽屉 */}
        <Drawer anchor="right" open={this.state.adminDrawer} onClose={() => this.handleDrawClose("adminDrawer")}>
          <div
            tabIndex={0}
            role="button">
            <AdminPanel /> {/* 设置操作面板 */}
          </div>
        </Drawer>
      </div>
    );
  }
}

// compose 从右向左组合多个函数，组合多个包装函数
// withStyles 生成包装组件，给DOM注入class名称
// connect 连接React组件与Redux store，返回新的已于Redux store连接的组件类
export default compose(withStyles(styles), connect((state) => ({
  channel: getChannel(state),
  channelList: getChannelList(state),
  notification: getNotification(state)
}), {
  getNotification: notification,
  getChangeChannel: changeChannel
}))(HeaderView)
