// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Body, Container, Left, Right } from 'native-base';
import { NavigationActions } from 'react-navigation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Sendbird from 'sendbird';

import type { GroupChannelListQuery } from 'sendbird';
import type { NavigationScreenProp } from 'react-navigation';
import type { UserData, ReduxState, Order, Room } from '../types';

import I18n from '../i18n';
import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import { Header, Avatar, Title } from '../components';
import { getRoomName } from './Chat';
import { store } from '../App';

const ONOVA_BOT_ID = '5bd1f7af46c62e6cdee546d0';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  hasError: boolean,
  isRefreshing: boolean,
  isLoading: boolean,
  listQuery: any,
  ordersAndChats: Array<any>,
};

class ChatContainer extends Component<Props, State> {
  static navigationOptions = (props: any) => {
    const state: ReduxState = store.getState();
    if (state.LoginReducer.skippedLogin) {
      return {
        tabBarOnPress: () => {
          // FIXME: hack
          props.navigation.navigate({
            routeName: 'inAppAuth',
            key: 'inAppAuth',
          });
        },
      };
    }
  };
  didFocusListener;
  state = {
    hasError: false,
    isRefreshing: false,
    isLoading: true,
    listQuery: null,
    ordersAndChats: [],
  };

  componentDidMount() {
    const sb = Sendbird.getInstance();
    if (!sb) {
      console.error('no Sendbird');
      this.setState({ hasError: true });
      return;
    }
    this.initialise();

    this.didFocusListener = this.props.navigation.addListener('didFocus', () => {
      if (sb) this.initialise();
      else console.error('no Sendbird didFocus');
    });
  }

  sbGetRooms = (groupChannelListQuery: GroupChannelListQuery) => {
    return new Promise((resolve, reject) => {
      groupChannelListQuery.next((channels, error) => {
        if (error) {
          return reject(error);
        }
        resolve(channels);
      });
    });
  };

  sbCreateGroupChannelListQuery = () => {
    const sb = Sendbird.getInstance();
    sb.removeAllChannelHandlers();
    return sb.GroupChannel.createMyGroupChannelListQuery();
  };

  componentWillUnmount() {
    if (this.didFocusListener) this.didFocusListener.remove();
  }

  initialise = () => {
    this.setState({ isLoading: true });
    const groupChannelListQuery = this.sbCreateGroupChannelListQuery();
    if (!groupChannelListQuery || !groupChannelListQuery.hasNext) {
      this.setState({ hasError: true, isLoading: false });
      return;
    }
    this.sbGetRooms(groupChannelListQuery)
      .then(this.getChatsAndTheirOrders)
      .then(ordersAndChats => this.setState({ ordersAndChats, isLoading: false }))
      .catch(err => {
        this.setState({ hasError: true, isLoading: false });
        console.error(err);
        ui.showToast(err.message);
      });
  };

  getChatsAndTheirOrders = async (rooms: Array<Sendbird.GroupChannel>): Promise<Array<Room>> => {
    console.debug('getChatsAndTheirOrders');
    const { token, userData } = this.props;
    let orders = await api.getOrders(token);
    orders = orders.filter((o: Order) => !['paid', 'cancelled', 'pending', 'reserved'].includes(o.status));
    if (orders.length === 0) return [];

    // const sb = Sendbird.getInstance();
    // const rooms = await sb.getJoinableRooms(); // invited
    const allRooms = [...rooms];

    // TODO:
    // filter chat rooms by checking if there is
    // at least one room name == order generated name
    // console.log(orders);
    const theseOrders = orders.map(o => getRoomName(o));
    let roomsAndTheirOrders = allRooms.filter(function(r) {
      return this.indexOf(r.name) >= 0;
    }, theseOrders);
    // // add order and room objects
    // roomsAndTheirOrders = roomsAndTheirOrders.map(r => {
    //   r.orders = orders.filter((o: Order) => getRoomName(o) == r.name);
    //   return r;
    // });

    roomsAndTheirOrders = allRooms;

    const ordersAndChats = roomsAndTheirOrders.map(room => {
      let partner;
      // TODO:
      // if (room.orders.filter(o => o.buyerType == 'UserWeb').length > 0) {
      //   partner = {
      //     userId: ONOVA_BOT_ID,
      //     name: `${room.orders[0].buyer.displayName} (web)`,
      //   };
      // } else {
      partner = room.members.filter(m => m.userId !== ONOVA_BOT_ID).find(m => m.userId !== userData._id);
      // }

      const isPartnerOnline = partner.connectionStatus === 'online';
      return {
        ...room,
        isPartnerOnline,
        partner,
      };
    });

    if (ordersAndChats.length > 1) {
      ordersAndChats.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
    }
    return ordersAndChats;
  };

  goToChat = (channelUrl: string) => {
    const navigateToChat = NavigationActions.navigate({
      routeName: 'chat',
      params: { channelUrl },
      key: `chat-${channelUrl}`,
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
    const { lastMessage } = item;
    const myUserId = this.props.userData._id;

    const isMyMessage = lastMessage.messageType !== 'admin' && lastMessage._sender.userId == myUserId;

    const from = isMyMessage ? I18n.t('chat_rooms.my_message_prefix') : '';

    return (
      <TouchableOpacity onPress={() => this.goToChat(item.url)}>
        <View style={st.itemContainer}>
          <Avatar
            onPress={() => this.goToChat(item.id)}
            size="verySmall"
            uri={item.partner.profileUrl}
            placeholderText={item.partner.nickname}
          />
          <View style={[st.flex1, st.content]}>
            <View style={st.contentHeader}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[st.name, item.unreadMessageCount > 0 && st.unread]}>{item.partner.nickname}</Text>
                {item.partner.connectionStatus === 'online' && <View style={st.onlineDot} />}
              </View>
              <Text style={[st.datetime, item.unreadMessageCount > 0 && st.unread]}>
                {ui.formatTime(lastMessage.createdAt)}
              </Text>
            </View>
            <View style={st.contentHeader}>
              <Text numberOfLines={1} style={[st.text, item.unreadMessageCount > 0 && st.unreadText]}>
                {from}
                {lastMessage.messageType === 'file' ? (
                  <Feather name="camera" size={11} color={colors.grey3} />
                ) : (
                  lastMessage.message
                )}
              </Text>
              {item.unreadMessageCount > 0 && (
                <Badge style={st.unreadBadge}>
                  <Text style={st.unreadBadgeText}>{item.unreadMessageCount}</Text>
                </Badge>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  _keyExtractor = (item: Sendbird.GroupChannel): string => item.url;

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
        <Text>{this.state.hasError ? I18n.t('chat_rooms.error') : I18n.t('chat_rooms.empty_state_message')}</Text>
      </View>
    );
  };

  refreshOrdersAndChats = () => {
    this.setState({ isRefreshing: true });

    const groupChannelListQuery = this.sbCreateGroupChannelListQuery();
    if (!groupChannelListQuery || !groupChannelListQuery.hasNext) {
      this.setState({ hasError: true, isRefreshing: false });
      return;
    }
    this.sbGetRooms(groupChannelListQuery)
      .then(this.getChatsAndTheirOrders)
      .then(ordersAndChats => this.setState({ ordersAndChats }))
      .catch(err => {
        console.debug(err);
        this.setState({ hasError: true });
      })
      .then(() => this.setState({ isRefreshing: false }));
  };

  renderHeader() {
    return (
      <Header>
        <Left style={st.container} />
        <Body style={st.container}>
          <Title>{I18n.t('chat_rooms.header')}</Title>
        </Body>
        <Right />
      </Header>
    );
  }

  render() {
    const { hasError, ordersAndChats, isLoading } = this.state;

    // const allOrders = ordersAndChats.reduce((a, b) => a.concat(b.orders), []);

    return (
      <Container>
        {this.renderHeader()}
        <View style={st.flex1}>
          {/* check userData to fix logout issue */}
          {(!hasError && isLoading) || !this.props.userData ? (
            <View style={st.container}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            // {allOrders.length > 0 && (
            //     <FlatList
            //       style={{ height: 60 + 8 + 8 }}
            //       data={allOrders}
            //       keyExtractor={this._keyExtractor}
            //       horizontal
            //       ItemSeparatorComponent={this._renderSeparatorHorizontal}
            //       renderItem={this._renderOrderCircle}
            //     />
            //   )}
            <FlatList
              data={ordersAndChats}
              // data={Array.from({ length: 15 }, _ => ordersAndChats[0])}
              ItemSeparatorComponent={this._renderSeparator}
              keyExtractor={this._keyExtractor}
              ListEmptyComponent={this.renderEmptyState}
              refreshControl={
                <RefreshControl refreshing={this.state.isRefreshing} onRefresh={this.refreshOrdersAndChats} />
              }
              renderItem={this._renderRoomRow}
              // style={st.root}
              // contentContainerStyle={{ flexGrow: 1 }}
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
  content: {
    marginLeft: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  datetime: {
    color: colors.grey1,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    paddingLeft: 19,
    paddingRight: 16,
    paddingVertical: 12,
  },
  name: {
    color: colors.black,
  },
  onlineDot: {
    backgroundColor: colors.green,
    borderRadius: 15,
    height: 4,
    width: 4,
    zIndex: 2,
  },
  separator: {
    backgroundColor: colors.grey5,
    height: StyleSheet.hairlineWidth,
  },
  separatorHorizontal: {
    width: 1,
  },
  unread: {
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: colors.active,
    height: 20,
    position: 'absolute',
    right: 0,
    width: 20,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 13,
  },
  unreadText: {
    fontWeight: 'bold',
    marginRight: 20,
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
});

const mapStateToProps = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const ChatRooms = connect(mapStateToProps)(ChatContainer);
