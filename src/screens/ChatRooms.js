// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  FlatList,
  // Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Body, Container, Left, Right, Title } from 'native-base';
import { NavigationActions } from 'react-navigation';
// import { AnimatedCircularProgress } from 'react-native-circular-progress';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

import type { NavigationScreenProp } from 'react-navigation';
// eslint-disable-next-line
import type { UserData, ReduxState, Order, Room } from '../types';

import I18n from '../i18n';
import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import { Header, Avatar } from '../components';
import { getRoomName } from './Chat';

import { currentUser as pusherCurrentUser } from '../actions/actionCreator';

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
  state = {
    hasError: false,
    isRefreshing: false,
    isLoading: true,
    listQuery: null,
    ordersAndChats: [],
  };

  componentWillMount() {
    if (pusherCurrentUser) {
      this.getChatsAndTheirOrders()
        .then(ordersAndChats => {
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
    } else {
      console.error('no pusherCurrentUser');
    }
  }

  getChatsAndTheirOrders(): Promise<Array<any>> {
    console.log('getChatsAndTheirOrders');
    let orders;
    const { token } = this.props.userData;
    const { userData } = this.props;
    return new Promise((resolve, reject) => {
      if (!pusherCurrentUser) return reject();
      api
        .getOrders(token)
        .then(o => {
          if (o.length === 0) {
            return resolve([]);
          }
          orders = o;
          return pusherCurrentUser.getJoinableRooms();
        })
        .then((rooms: Array<any>) => {
          return [...rooms, ...pusherCurrentUser.rooms];
        })
        .then(allRooms => {
          // let roomsAndTheirOrders = allRooms.filter(r => {
          //   const o = orders.filter((o: Order) => getRoomName(o) == r.name);
          //   if (o) return true;
          //   return false;
          // });

          // filter chat rooms by checking if there is
          // at least one room name == order generated name
          const thisOrders = orders.map(o => getRoomName(o));
          let roomsAndTheirOrders = allRooms.filter(function(r) {
            return this.indexOf(r.name) >= 0;
          }, thisOrders);
          // add order and room objects
          roomsAndTheirOrders = roomsAndTheirOrders.map(r => {
            r.orders = orders.filter((o: Order) => getRoomName(o) == r.name);
            return r;
          });

          return Promise.all(
            roomsAndTheirOrders.map(async room => {
              let msgs;
              try {
                msgs = await pusherCurrentUser.fetchMessages({
                  roomId: room.id,
                  direction: 'older',
                  limit: 1,
                });
              } catch (err) {
                throw new Error(err);
              }
              const partner = room.users.filter(u => u.id !== userData._id)[0];
              const cursor = await pusherCurrentUser.readCursor({
                roomId: room.id,
              });

              const isPartnerOnline = partner.presence.state == 'online';
              return {
                ...room,
                // if no messages (very first order step)
                lastMessage: msgs.length
                  ? msgs[0]
                  : { createdAt: room.createdAt },
                hasUnreadMessages: cursor
                  ? cursor.position < msgs[0].id
                  : false,
                isPartnerOnline,
                partner,
              };
            })
          );
        })
        .then(ordersAndChats => {
          if (ordersAndChats.length > 1) {
            return ordersAndChats.sort(
              (a, b) =>
                new Date(b.lastMessage.createdAt) -
                new Date(a.lastMessage.createdAt)
            );
          }
          return ordersAndChats;
        })
        .then(ordersAndChats => resolve(ordersAndChats))
        .catch(e => reject(e));
    });
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

  goToChat = (roomId: string) => {
    const navigateToChat = NavigationActions.navigate({
      routeName: 'chat',
      params: { roomId },
      key: `chat-${roomId}`,
    });
    this.props.navigation.dispatch(navigateToChat);
  };

  /*
  _renderOrderCircle = ({ item }: { item: Room }) => {
    // if no messages (very first order step)
    if (!item.lastMessage) {
      item.lastMessage = { senderId: -1, createdAt: item.createdAt };
    }

    const { status, product } = item;
    let perc = 0;

    // if (status == 'confirmed') perc = 0;
    if (status == 'shipped') perc = 33.33;
    if (status == 'delivered') perc = 66.66;
    if (status == 'completed') perc = 100;
    return (
      <TouchableOpacity
        style={st.orderCircle}
        onPress={() => this.goToChat(item.id)}>
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
  */

  _renderRoomRow = ({ item }: { item: Room }) => {
    let { lastMessage } = item;
    let from;
    const myUserId = this.props.userData._id;

    // if (lastMessage.messageType == 'user') {
    const isMyMessage = lastMessage.senderId == myUserId;

    from = isMyMessage ? I18n.t('chat_rooms.my_message_prefix') : '';
    // } else {
    //   // admin messages
    //   from = `${lastMessage.messageType}: `;
    // }

    return (
      <TouchableOpacity onPress={() => this.goToChat(item.id)}>
        <View style={st.itemContainer}>
          <Avatar
            onPress={() => this.goToChat(item.id)}
            size="verySmall"
            uri={item.partner.avatarURL}
            placeholderText={item.partner.name}
          />
          <View style={[st.flex1, st.content]}>
            <View style={st.contentHeader}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[st.name, item.hasUnreadMessages && st.unread]}>
                  {item.partner.name}
                </Text>
                {lastMessage.senderId !== -1 &&
                  item.isPartnerOnline && <View style={st.onlineDot} />}
              </View>
              <Text style={[st.datetime, item.hasUnreadMessages && st.unread]}>
                {ui.formatTime(lastMessage.createdAt)}
              </Text>
            </View>
            <View style={st.contentHeader}>
              <Text
                numberOfLines={1} // android
                style={[item.hasUnreadMessages && st.unread]}>
                {from}
                {lastMessage.attachment ? (
                  <Feather name="camera" size={11} color={colors.grey3} />
                ) : (
                  lastMessage.text
                )}
              </Text>
              {item.hasUnreadMessages && (
                <View style={st.unreadDot}>
                  <Text style={{ color: colors.white, top: -2, fontSize: 13 }}>
                    1
                  </Text>
                </View>
              )}
            </View>
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
      <View style={st.emptyContainer}>
        <MaterialCommunityIcons
          size={48}
          name="cart-plus"
          color={colors.grey2}
          style={{ alignSelf: 'center', marginBottom: 30 }}
        />
        <Text>
          {this.state.hasError
            ? I18n.t('chat_rooms.error')
            : I18n.t('chat_rooms.empty_state_message')}
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

    // const allOrders = ordersAndChats.reduce((a, b) => a.concat(b.orders), []);

    return (
      <Container>
        <Header>
          <Left style={st.container} />
          <Body style={st.container}>
            <Title style={{ color: colors.black }}>
              {I18n.t('chat_rooms.header')}
            </Title>
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
              {/* {allOrders.length > 0 && (
                <FlatList
                  style={{ height: 60 + 8 + 8 }}
                  data={allOrders}
                  keyExtractor={this._keyExtractor}
                  horizontal
                  ItemSeparatorComponent={this._renderSeparatorHorizontal}
                  renderItem={this._renderOrderCircle}
                />
              )} */}
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
                renderItem={this._renderRoomRow}
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
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  root: {
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
    color: colors.black,
  },
  unread: {
    fontWeight: 'bold',
  },
  datetime: {
    fontSize: 12,
    color: colors.grey1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  // orderCircle: {
  //   marginHorizontal: 10,
  //   marginVertical: 4,
  // },
  // itemImage: {
  //   borderRadius: 50,
  //   borderWidth: 2,
  //   borderColor: colors.white,
  //   height: '100%',
  //   width: '100%',
  // },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
  separatorHorizontal: {
    width: 1,
  },
  onlineDot: {
    backgroundColor: colors.green,
    borderRadius: 15,
    height: 4,
    width: 4,
    zIndex: 2,
  },
  unreadDot: {
    backgroundColor: colors.active,
    borderRadius: 15,
    height: 15,
    width: 15,
    paddingLeft: 3.5,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const ChatRooms = connect(mapStateToProps)(ChatContainer);
