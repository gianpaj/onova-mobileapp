// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { AnimatedCircularProgress } from 'react-native-circular-progress';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, ReduxState, Order } from '../types';
import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import { Avatar } from '../components';

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
        console.debug(err);
        ui.showToast(err.message);
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
            // match by orderId from API and SendBird metadata
            const ch = channels.filter(c => {
              return orders.find((o: Order) => o.id == c.orderId);
            });
            // add order order and channel objects
            return ch.map(c => {
              c.order = orders.find((o: Order) => o.id == c.orderId);
              return c;
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
        .then(res => resolve(res.data))
        .catch(err => reject(err));
    });
  }

  fetchOrder(orderId: string): Promise<Order> {
    const { token } = this.props.userData;

    return new Promise((resolve, reject) => {
      api
        .get(`/api/orders/${orderId}`, { token })
        .then(({ data }) => resolve(data))
        .catch(err => reject(err));
    });
  }

  connectToSendBird(): Promise<null | any> {
    return new Promise((resolve, reject) => {
      // @TODO: remove this if don't get a warning when quickly opening a chat thread.
      // Maybe from a deeplink, opening app from background?
      setTimeout(() => {
        this.sb = SendBird.getInstance();
        if (!this.sb) return reject(new Error('no SendBird instance'));
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
    }
    return true;
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
      .catch(e => {
        ui.showToast(e.message);
        console.debug(e);
      });
  };

  getInterlocutor = (item): any => {
    let interlocutor = item.members.find(m => m.userId !== myUserId);
    const { order }: { order: Order } = item;
    const { _id: myUserId } = this.props.userData;

    interlocutor.profilePic = order.seller.profilePic;
    if (order.buyer._id !== myUserId) {
      interlocutor.profilePic = order.buyer.profilePic;
    }
    return interlocutor;
  };

  _renderOrderCircle = ({ item }) => {
    const { status, product } = item.order;
    let perc = 0;
    // if (status == 'confirmed') perc = 0;
    if (status == 'shipped') perc = 33.33;
    if (status == 'delivered') perc = 66.66;
    if (status == 'completed') perc = 100;
    return (
      <TouchableOpacity
        style={st.orderCircle}
        onPress={() => this.goToOrderThread(item)}>
        <AnimatedCircularProgress
          backgroundColor={colors.pDark}
          fill={perc}
          rotation={0}
          size={60}
          tintColor={colors.secondary}
          width={2}>
          {() => (
            <Image
              style={st.itemImage}
              source={{ uri: product.photoURIs[0] }}
            />
          )}
        </AnimatedCircularProgress>
      </TouchableOpacity>
    );
  };

  _renderOrderRow = ({ item }) => {
    const { lastMessage }: { lastMessage: any } = item;
    const interlocutor = this.getInterlocutor(item);
    const haveUnreadMsgs = item.unreadMessageCount > 0;
    let from;

    if (lastMessage.messageType == 'user') {
      const isMyMessage = lastMessage._sender.nickname == interlocutor.nickname;

      from = isMyMessage ? 'You: ' : '';
    } else {
      // admin messages
      from = `${lastMessage.messageType}: `;
    }

    return (
      <TouchableOpacity onPress={() => this.goToOrderThread(item)}>
        <View style={st.itemContainer}>
          <Avatar
            onPress={() => this.goToOrderThread(item)}
            placeholderText={interlocutor.nickname}
            size={'verySmall'}
            uri={interlocutor.profilePic}
            withBorder
          />
          <View style={[st.flex1, st.content]}>
            <View style={st.contentHeader}>
              {/* displayName */}
              <Text style={st.name}>{interlocutor.nickname}</Text>
              <Text style={st.datetime}>
                {ui.formatTime(lastMessage.createdAt)}
              </Text>
            </View>
            <Text
              numberOfLines={1} // android
              // eslint-disable-next-line
              style={haveUnreadMsgs ? { fontWeight: 'bold' } : {}}>
              {from}
              {lastMessage.message}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  _keyExtractor(item): string {
    return item.url;
  }

  _renderSeparator = () => <View style={st.separator} />;
  _renderSeparatorHorizontal = () => <View style={st.separatorHorizontal} />;

  renderEmptyState = () => {
    if (this.state.channelList.length > 0) return null;
    return (
      <View style={[st.container]}>
        <Text>
          {this.state.hasError ? 'Error fetching orders' : 'No orders found'}
        </Text>
      </View>
    );
  };

  refreshChannelList = () => {
    this.setState({ isRefreshing: true });
    this.getOrdersAndChats()
      .then(channelList => this.setState({ channelList }))
      .catch(err => {
        console.debug(err);
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
            <View>
              <FlatList
                style={{ height: 60 + 8 + 8 }}
                data={channelList}
                keyExtractor={this._keyExtractor}
                horizontal
                ItemSeparatorComponent={this._renderSeparatorHorizontal}
                renderItem={this._renderOrderCircle}
              />
              <FlatList
                data={channelList}
                extraData={this.state} // make sure will re-render when the state.selected changes (if we want have real time updates of the last message of each thread)
                ItemSeparatorComponent={this._renderSeparator}
                keyExtractor={this._keyExtractor}
                ListEmptyComponent={this.renderEmptyState}
                refreshControl={
                  <RefreshControl
                    refreshing={this.state.isRefreshing}
                    onRefresh={this.refreshChannelList}
                  />
                }
                renderItem={this._renderOrderRow}
                style={st.root}
              />
            </View>
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
    height: '100%',
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
  orderCircle: {
    marginHorizontal: 10,
    marginVertical: 4,
  },
  itemImage: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.white,
    height: '100%',
    width: '100%',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
  separatorHorizontal: {
    width: 1,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const OrdersList = connect(mapStateToProps)(OrdersListContainer);
