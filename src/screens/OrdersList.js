// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  StyleSheet,
  Linking,
  FlatList,
  Platform,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  // $FlowFixMe
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Container,
  Header,
  Icon as NBIcon,
  Left,
  Right,
  Title,
} from 'native-base';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationActions } from 'react-navigation';
import SendBird from 'sendbird';
import type { NavigationScreenProp } from 'react-navigation';

import { format, differenceInHours, distanceInWordsToNow } from 'date-fns';

import type { Message, UserData, ReduxState } from '../types';
import colors from '../config/colors';
import * as api from '../utils/api';
import { Avatar } from '../components/index';

type Order = {
  _id: number,
  lastMessage: Message,
  unreadMessageCount: number,
};

type Props = {
  navigation: NavigationScreenProp<any>,
  userData: UserData,
};

type State = {
  hasError: boolean,
  isRefreshing: boolean,
  isLoading: boolean,
  orders: Array<Order>,
};

const temp = [
  {
    _id: 1,
    unreadMessageCount: 0,
    lastMessage: {
      _id: '1',
      text: 'hi',
      createdAt: new Date('2018-01-26T12:00:00'),
      user: {
        _id: '1',
        name: 'john',
        avatar: '',
      },
    },
  },
  {
    _id: 2,
    unreadMessageCount: 0,
    lastMessage: {
      _id: '1',
      text: 'selling good clothes',
      createdAt: new Date('2018-01-16T12:00:00'),
      user: {
        _id: '1',
        name: 'marry',
        avatar: '',
      },
    },
  },
  {
    _id: 3,
    unreadMessageCount: 0,
    lastMessage: {
      _id: '1',
      text: 'who is this Jesus you talk about',
      createdAt: new Date('0017-01-26T12:00:00'),
      user: {
        _id: '1',
        name: 'joseph',
        avatar: '',
      },
    },
  },
];

class OrdersListContainer extends Component<Props, State> {
  sb: any;

  state = {
    hasError: false,
    isRefreshing: false,
    isLoading: true,
    orders: [],
  };

  componentWillMount() {
    // this.setState({ isLoading: true });

    setTimeout(() => {
      this.setState({
        orders: temp,
      });
    }, 1000);

    this.setState({ isLoading: false });
  }

  fetchItems = () => {
    setTimeout(() => {
      const one = temp[0];
      const two = temp[1];
      this.setState({ orders: [one, two] });
    }, 1000);
  };

  connectToSendBird(): Promise<null | any> {
    return new Promise((resolve, reject) => {
      // @TODO: remove this if don't get a warning when quickly opening a chat thread.
      // Maybe from a deeplink, opening app from background?
      setTimeout(() => {
        this.sb = SendBird.getInstance();
        this.sb.connect(this.props.userData._id, (user, err: any) => {
          if (err) return reject(err);

          console.debug(user);

          this.createRoomAndGetMessages(this.state.interlocutor._id);

          this.sb.addChannelHandler('ChatView', this.createChannelHandler());

          const ConnectionHandler = new this.sb.ConnectionHandler();
          ConnectionHandler.onReconnectSucceeded = () => {
            this.getRoomMessages(true);
            // $FlowFixMe
            this.state.channel.refresh(() => {
              this.getRoomMessages(false);
            });
          };
          this.sb.addConnectionHandler('ChatView', ConnectionHandler);

          this.getRoomMessages(false);
          resolve();
        });
      }, 500);
    });
  }

  createGiftedMessage(msg: SendBirdMessage, user: UserData | any): Message {
    return {
      _id: msg.messageId,
      createdAt: new Date(msg.createdAt),
      text: msg.message,
      user: {
        _id: user._id,
        // $FlowFixMe
        name: user.username || user.name,
        // $FlowFixMe
        avatar: user.profilePic,
        // avatar: user.profilePic !== null ? user.profilePic : null,
        // avatar: user.profilePic || msg.sender.profileUrl,
      },
    };
  }

  componentWillUnmount() {
    // this.sb.disconnect(() => console.debug('SendBird disconnected'));
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

  goToProfile = () => {
    const user = this.props.navigation.state.params.seller;

    const navigateToProfile = NavigationActions.navigate({
      routeName: 'profile',
      params: user,
    });

    this.props.navigation.dispatch(navigateToProfile);
  };

  _renderItem = (item: any) => {
    const { lastMessage } = item.item;
    return (
      <TouchableOpacity
        onPress={() =>
          this.props.navigation.navigate('orderThread', {
            order: item.order,
          })
        }>
        <View style={st.itemContainer}>
          <Avatar
            // style={styles.avatarContainer}
            size={'verySmall'}
            withBorder
            uri={''}
            placeholderText={lastMessage.user.name}
          />
          <View style={[st.flex1, st.content]}>
            <View style={st.contentHeader}>
              {/* displayName */}
              <Text style={st.name}>{lastMessage.user.name}</Text>
              {differenceInHours(new Date(), lastMessage.createdAt) < 24 ? (
                <Text style={st.datetime}>
                  {distanceInWordsToNow(lastMessage.createdAt)}
                </Text>
              ) : (
                <Text style={st.datetime}>
                  {format(lastMessage.createdAt, 'D MMM')}
                </Text>
              )}
            </View>
            <Text numberOfLines={2} rkType="primary3 mediumLine">
              {lastMessage.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  _keyExtractor(item) {
    return item._id;
  }

  _renderSeparator() {
    return <View style={st.separator} />;
  }

  renderEmptyState = () => {
    if (this.state.orders.length > 1 || !this.state.isLoading) return null;
    return (
      <View style={[st.container]}>
        <Text style={st.text}>
          {this.state.hasError ? 'Error fetching orders' : 'No orders found'}
        </Text>
      </View>
    );
  };

  renderRefreshControl = (
    <RefreshControl
      refreshing={this.state.isRefreshing}
      onRefresh={this.fetchItems}
    />
  );

  render() {
    const { hasError, orders, isLoading } = this.state;

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
              data={orders}
              extraData={this.state} // make sure will re-render when the state.selected changes
              refreshControl={this.renderRefreshControl}
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
    backgroundColor: colors.grey4,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const OrdersList = connect(mapStateToProps)(OrdersListContainer);
