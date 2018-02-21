// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableHighlight,
  RefreshControl,
} from 'react-native';
// prettier-ignore
import {
  Body,
  Container,
  Header,
  Left,
  Right,
  Title,
} from 'native-base';
import { NavigationActions } from 'react-navigation';
import SendBird from 'sendbird';
import type { NavigationScreenProp } from 'react-navigation';
// $FlowFixMe
import {
  format,
  differenceInHours,
  distanceInWordsToNow,
  isYesterday,
} from 'date-fns';

import type { UserData, ReduxState, Order, Product } from '../types';
import colors from '../config/colors';
import * as api from '../utils/api';
import { Avatar } from '../components/index';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  hasError: boolean,
  isRefreshing: boolean,
  isLoading: boolean,
  listQuery: any,
  channelList: Array<any>,
};

class OrdersListContainer extends Component<Props, State> {
  sb;

  state = {
    hasError: false,
    isRefreshing: false,
    isLoading: true,
    listQuery: null,
    channelList: [],
  };

  componentWillMount() {
    this.connectToSendBird()
      .then(() => this.getOrdersAndChats())
      .then(ordersAndChats => {
        this.setState({
          channelList: ordersAndChats,
          isLoading: false,
        });
      })
      .catch(err => {
        this.setState({ hasError: true });
        console.error(err);
      });
  }

  getOrdersAndChats(): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.fetchOrders()
        .then(orders => {
          if (orders.length === 0) {
            return resolve([]);
          }
          return this.getChannels().then(channels => {
            // orders in which the other person (seller or buyer) is the person i am chatting with
            return channels.filter(c => {
              return orders.find((o: Order) => o.id == c.orderId);
            });
          });
        })
        .then(ordersAndChats => resolve(ordersAndChats))
        .catch(e => reject(e));
    });
  }

  getChannels(): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      return this.fetchChannelList()
        .then(channels => {
          let channelsWithMeta = [];

          var todo = channels.length;
          if (!todo) return resolve([]);

          channels.forEach(c => {
            c.getMetaData(['orderId'], (res, err) => {
              if (err) return reject(err);
              c.orderId = res.orderId;
              channelsWithMeta.push(c);
              if (--todo === 0) resolve(channelsWithMeta);
            });
          });
        })
        .catch(e => reject(e));
    });
  }

  fetchOrders(): Promise<Array<Order>> {
    const { token } = this.props.userData;
    return new Promise((resolve, reject) => {
      api
        .get('/api/orders/', { token })
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  fetchOrder(orderId: string): Promise<Order> {
    const { token } = this.props.userData;

    return new Promise((resolve, reject) => {
      api
        .get(`/api/orders/${orderId}`, { token })
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  connectToSendBird(): Promise<null | any> {
    return new Promise((resolve, reject) => {
      // @TODO: remove this if don't get a warning when quickly opening a chat thread.
      // Maybe from a deeplink, opening app from background?
      setTimeout(() => {
        this.sb = SendBird.getInstance();
        this.sb.connect(this.props.userData._id, (user, err) => {
          if (err) return reject(err);

          console.debug(user);

          const ConnectionHandler = new this.sb.ConnectionHandler();
          ConnectionHandler.onReconnectSucceeded = () => {
            this.getOrdersAndChats();
          };
          this.sb.addConnectionHandler(
            'ConnectionHandlerInList',
            ConnectionHandler
          );

          resolve();
        });
      }, 200);
    });
  }

  fetchChannelList = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const listQuery = this.sb.GroupChannel.createMyGroupChannelListQuery();
      listQuery.includeEmpty = true;
      listQuery.limit = 20; // pagination limit could be set up to 100
      listQuery.next((channelList, err) => {
        if (err) return reject(err);

        resolve(channelList);
      });
    });
  };

  componentWillUnmount() {
    this.sb.disconnect(() => console.debug('SendBird disconnected'));
    this.sb.removeChannelHandler('ConnectionHandlerInList');
  }

  componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;
  }

  shouldComponentUpdate(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) {
      return false;
    } else {
      return true;
    }
  }

  goToOrderThread = (item: any) => {
    console.log(item);
    this.fetchOrder(item.orderId)
      .then((order: Order) => {
        const interlocutorId = item.members.find(
          m => m.userId !== this.props.userData._id
        ).userId;
        const navigateToOrderThread = NavigationActions.navigate({
          routeName: 'orderThread',
          params: {
            productId: order.product.uuid,
            orderId: order.id,
            userId: interlocutorId,
          },
          key: `orderThread-${order.id}`,
        });
        this.props.navigation.dispatch(navigateToOrderThread);
      })
      .catch(e => console.error(e));
  };

  formatTime(createdAt: Date): string {
    if (differenceInHours(new Date(), createdAt) < 24) {
      return format(createdAt, 'HH:mm');
    }
    if (isYesterday(createdAt)) {
      return 'Yesterday';
    } else {
      return format(createdAt, 'D MMM');
    }
  }

  _renderItem = ({ item }) => {
    const { lastMessage } = item;

    const interlocutor = item.members.find(
      m => m.userId !== this.props.userData._id
    ).nickname;

    const isMyMessage = lastMessage._sender.nickname !== interlocutor;

    const haveUnreadMsgs = !isMyMessage && item.unreadMessageCount > 0;

    return (
      <TouchableHighlight
        underlayColor={colors.grey4}
        onPress={() => this.goToOrderThread(item)}>
        <View style={st.itemContainer}>
          <Avatar
            // style={styles.avatarContainer}
            size={'verySmall'}
            withBorder
            uri={''}
            placeholderText={interlocutor}
          />
          <View style={[st.flex1, st.content]}>
            <View style={st.contentHeader}>
              {/* displayName */}
              <Text style={st.name}>{interlocutor}</Text>
              <Text style={st.datetime}>
                {this.formatTime(lastMessage.createdAt)}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={haveUnreadMsgs ? { fontWeight: 'bold' } : {}}>
              {isMyMessage ? 'You: ' : ''}
              {lastMessage.message}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  };

  _keyExtractor(item): string {
    return item.url;
  }

  _renderSeparator() {
    return <View style={st.separator} />;
  }

  renderEmptyState = () => {
    if (this.state.channelList.length > 0) return null;
    return (
      <View style={[st.container]}>
        <Text style={st.text}>
          {this.state.hasError ? 'Error fetching orders' : 'No orders found'}
        </Text>
      </View>
    );
  };

  refreshChannelList = () => {
    this.setState({ isRefreshing: true });
    this.getOrdersAndChats()
      .then(ordersAndChats => {
        this.setState({ channelList: ordersAndChats });
      })
      .catch(err => {
        console.error(err);
        this.setState({ hasError: true });
      })
      .then(() => this.setState({ isRefreshing: false }));
  };

  render() {
    const { hasError, channelList, isLoading } = this.state;

    return (
      <Container>
        <Header>
          <Left />
          <Body>
            <Title>Orders</Title>
          </Body>
          <Right />
        </Header>
        <View style={st.flex1}>
          {!hasError && isLoading ? (
            <View style={st.container}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <FlatList
              style={st.root}
              data={channelList}
              extraData={this.state} // make sure will re-render when the state.selected changes
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshChannelList}
                />
              }
              ItemSeparatorComponent={this._renderSeparator}
              keyExtractor={this._keyExtractor}
              ListEmptyComponent={this.renderEmptyState}
              renderItem={this._renderItem}
            />
          )}
        </View>
      </Container>
    );
  }
}

const st = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  root: {
    backgroundColor: colors.bgDefault,
  },
  flex1: {
    flex: 1,
  },
  itemContainer: {
    paddingLeft: 19,
    paddingRight: 16,
    paddingVertical: 12,
    flexDirection: 'row',
  },
  content: {
    marginLeft: 16,
  },
  name: {
    color: colors.grey1,
    fontWeight: '800',
  },
  datetime: {
    color: colors.grey1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const OrdersList = connect(mapStateToProps)(OrdersListContainer);
