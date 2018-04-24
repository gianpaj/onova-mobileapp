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
import { Body, Container, Header, Left, Right, Title } from 'native-base';
import { NavigationActions } from 'react-navigation';
import { ChatManager, TokenProvider } from '@pusher/chatkit/react-native';

import { AnimatedCircularProgress } from 'react-native-circular-progress';

import type { NavigationScreenProp } from 'react-navigation';
// eslint-disable-next-line
import type { UserData, ReduxState, Order, PusherUser, Room } from '../types';
import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import { Avatar } from '../components';
import { getRoomName } from './Chat';

let config;

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  hasError: boolean,
  isRefreshing: boolean,
  isLoading: boolean,
  listQuery: any,
  ordersAndChats: Array<any>,
};

class ChatContainer extends Component<Props, State> {
  currentUser: PusherUser;
  state = {
    hasError: false,
    isRefreshing: false,
    isLoading: true,
    listQuery: null,
    ordersAndChats: [],
  };

  constructor() {
    super();
    if (process.env.NODE_ENV == 'dev') {
      config = require('../../config-dev.json');
    } else {
      config = require('../../config-prod.json');
    }
  }

  componentWillMount() {
    this.connectToPusher()
      .then(u => (this.currentUser = u))
      .then(() => this.getChatsAndTheirOrders())
      .then(ordersAndChats => {
        console.log(ordersAndChats);
        this.setState({
          ordersAndChats,
          isLoading: false,
        });
      })
      .catch(err => {
        this.setState({ hasError: true });
        console.debug(err);
        ui.showToast(err.message);
      });
  }

  getChatsAndTheirOrders(): Promise<Array<any>> {
    console.log('getChatsAndTheirOrders');
    return new Promise((resolve, reject) => {
      let orders;
      this.fetchOrders()
        .then(o => {
          if (o.length === 0) {
            return resolve([]);
          }
          orders = o;
          return this.currentUser.getJoinableRooms();
        })
            console.log(allRooms);
            let ordersAndRooms = allRooms.filter(r => {
              return orders.find((o: Order) => getRoomName(o) == r.name);
            });
        .then((rooms: Array<any>) => {
          const allRooms = [...rooms, ...this.currentUser.rooms];
          return allRooms;
        })
        .then(allRooms => {
          const { userData } = this.props;
          // filter chat rooms by checking if there is
          // at least one room name == order generated name
            });

            return Promise.all(
              ordersAndRooms.map(async room => {
                const msgs = await this.currentUser.fetchMessages({
          // add order and room objects
          roomsAndTheirOrders = roomsAndTheirOrders.map(r => {
            r.orders = orders.filter((o: Order) => getRoomName(o) == r.name);
            return r;
          });
                  roomId: room.id,
                  direction: 'older',
                  limit: 1,
                });
                const partner = this.currentUser.users.filter(
                  u => u.id !== userData._id
                )[0];
                const cursor = await this.currentUser.readCursor({
                  roomId: room.id,
                });

                // TODO: set haveUnreadMsgs
                if (cursor) console.log(cursor.position);
                const isPartnerOnline = partner.presence.state == 'online';
                room.lastMessage = msgs[0];
                room.isPartnerOnline = isPartnerOnline;
                room.partner = partner;
                return room;
              })
            );
          })
          .then(ordersAndChats => resolve(ordersAndChats))
          .catch(e => reject(e));
      });
    });
  }

  fetchOrders(): Promise<Array<Order>> {
    const { token } = this.props.userData;
    return new Promise((resolve, reject) => {
      api
        .get('/api/orders/', { token })
        .then(({ data }) => resolve(data))
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

  connectToPusher = (): Promise<Error | PusherUser> => {
    console.log('connectToPusher');
    const { userData } = this.props;
    return new Promise((resolve, reject) => {
      const chatManager = new ChatManager({
        instanceLocator: config.PUSHER_INSTANCE,
        userId: userData._id,
        tokenProvider: new TokenProvider({
          url: config.PUSHER_TOKEN_PROVIDER,
          headers: {
            token: userData.token,
            avatarURL: userData.profilePic,
            username: userData.username,
          },
        }),
        logger: {
          error: console.log,
          warn: console.log,
          info: () => {},
          debug: () => {},
          verbose: () => {},
        },
      });
      chatManager
        .connect()
        .then(currentUser => resolve(currentUser))
        .catch(err => reject(err));
    });
  };

  componentWillUnmount() {
    this.currentUser.roomSubscriptions[this.state.roomId].cancel();
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

  goToChat = item => {
    const { order } = item;
    this.fetchOrder(order.id)
      .then((order: Order) => {
        const navigateToChat = NavigationActions.navigate({
          routeName: 'chat',
          params: {
            productUuid: order.product.uuid,
            orderId: order.id,
            userId: item.partner.id,
            roomId: item.id,
          },
          key: `chat-${order.id}`,
        });
        this.props.navigation.dispatch(navigateToChat);
      })
      .catch(e => {
        ui.showToast(e.message);
        console.debug(e);
      });
  };

  _renderOrderCircle = ({ item }: { item: Room }) => {
    if (!item.lastMessage) return null;

    const { status, product } = item.order;
    let perc = 0;

    // if (status == 'confirmed') perc = 0;
    if (status == 'shipped') perc = 33.33;
    if (status == 'delivered') perc = 66.66;
    if (status == 'completed') perc = 100;
    return (
      <TouchableOpacity
        style={st.orderCircle}
        onPress={() => this.goToChat(item)}>
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

  _renderOrderRow = ({ item }: { item: Room }) => {
    let { lastMessage }: { lastMessage: any } = item;
    const { _id: myUserId } = this.props.userData;
    let from;

    // if no messages (very first order step)
    if (!lastMessage) {
      lastMessage = { senderId: -1, createdAt: item.createdAt };
    }

    // if (lastMessage.messageType == 'user') {
    const isMyMessage = lastMessage.senderId == myUserId;

    from = isMyMessage ? 'You: ' : '';
    // } else {
    //   // admin messages
    //   from = `${lastMessage.messageType}: `;
    // }

    return (
      <TouchableOpacity onPress={() => this.goToChat(item)}>
        <View style={st.itemContainer}>
          <Avatar
            onPress={() => this.goToChat(item)}
            placeholderText={item.partner.name}
            size="verySmall"
            uri={item.partner.avatarURL}
            withBorder
          />

          <View style={[st.flex1, st.content]}>
            <View style={st.contentHeader}>
              <Text style={st.name}>{item.partner.name}</Text>
              <Text style={st.datetime}>
                {ui.formatTime(lastMessage.createdAt)}
              </Text>
            </View>
            <Text
              numberOfLines={1} // android
              // eslint-disable-next-line
              // style={item.haveUnreadMsgs ? { fontWeight: 'bold' } : {}}
            >
              {from}
              {lastMessage.text}
            </Text>
            {lastMessage.senderId !== -1 && (
              <Text>{item.isPartnerOnline ? 'online' : 'offline'}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  _keyExtractor = (item): number => item.id.toString();

  _renderSeparator = () => <View style={st.separator} />;
  _renderSeparatorHorizontal = () => <View style={st.separatorHorizontal} />;

  renderEmptyState = () => {
    if (this.state.ordersAndChats.length > 0) return null;
    return (
      <View style={[st.container]}>
        <Text>
          {this.state.hasError ? 'Error fetching chats' : 'No chats found'}
        </Text>
      </View>
    );
  };

  refreshOrdersAndChats = () => {
    this.setState({ isRefreshing: true });
    this.getChatsAndTheirOrders()
      .then(ordersAndChats => this.setState({ ordersAndChats }))
      .catch(err => {
        console.debug(err);
        this.setState({ hasError: true });
      })
      .then(() => this.setState({ isRefreshing: false }));
  };

  render() {
    const { hasError, ordersAndChats, isLoading } = this.state;

    const allOrders = ordersAndChats.reduce((a, b) => a.concat(b.orders), []);

    return (
      <Container>
        <Header>
          <Left />
          <Body>
            <Title>Chats and Orders</Title>
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
              {ordersAndChats.length > 0 && (
                <FlatList
                  style={{ height: 60 + 8 + 8 }}
                  data={ordersAndChats}
                  keyExtractor={this._keyExtractor}
                  horizontal
                  ItemSeparatorComponent={this._renderSeparatorHorizontal}
                  renderItem={this._renderOrderCircle}
                />
              )}
              <FlatList
                data={ordersAndChats}
                ItemSeparatorComponent={this._renderSeparator}
                keyExtractor={this._keyExtractor}
                ListEmptyComponent={this.renderEmptyState}
                refreshControl={
                  <RefreshControl
                    refreshing={this.state.isRefreshing}
                    onRefresh={this.refreshOrdersAndChats}
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

export const ChatRooms = connect(mapStateToProps)(ChatContainer);
