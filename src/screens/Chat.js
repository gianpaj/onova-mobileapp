// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Body,
  Button as NBButton,
  // CardItem,
  Container,
  Icon as NBIcon,
  Left,
  Right,
  Title,
} from 'native-base';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationActions } from 'react-navigation';
import { GiftedChat, Bubble, SystemMessage } from 'react-native-gifted-chat';

import { currentUser as pusherCurrentUser } from '../actions/actionCreator';
import I18n from '../i18n';

import type { NavigationScreenProp } from 'react-navigation';

import { Header, Send } from '../components';
import type {
  Message,
  Order,
  ReduxState,
  PusherMessage,
  UserData,
  // eslint-disable-next-line
} from '../types';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';

const MARK_AS_READ_AFTER_MS = 300;

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  partner: UserData,
  isLoading: boolean,
  // isTyping: boolean,
  messages: Array<Message>,
  orders: Array<Order>,
  roomId: number,
  shouldRefresh: boolean,
};

class ChatContainer extends Component<Props, State> {
  sb;
  rejectProm;

  state = {
    partner: null,
    isLoading: true,
    // isTyping: false,
    orders: [],
    messages: [],
    roomId: -1,
    shouldRefresh: false,
  };

  componentWillMount() {
    const { params } = this.props.navigation.state;

    this.props.navigation.addListener('willFocus', () => {
      const { roomId, shouldRefresh } = this.state;
      // do not initiate twice at the beginning
      // OR
      // when it should not refresh (review hasn't been added or order archived)
      if (roomId == -1 || !shouldRefresh) return;
      this.setState({ isLoading: true }, () =>
        this.initialise(roomId)
          .then(this.setState({ isLoading: false, shouldRefresh: false }))
          .catch(e => console.error(e))
      );
    });

    // for development
    if (!params) {
      const roomId = 7305579;

      return this.initialise(roomId)
        .then(() => this.setState({ isLoading: false }))
        .catch(err => {
          if (err && err.message !== 'no partner') console.error(err);
        });
    }
    // coming from Product, ChatRooms or Push Notification
    this.initialise(params.roomId, params.productUuid)
      .then(() => this.setState({ isLoading: false }))
      .catch(err => {
        if (err && err.message !== 'no partner') console.error(err);
      });
  }

  shouldRefresh(shouldRefresh: boolean) {
    this.setState({ shouldRefresh });
  }

  componentWillUnmount() {
    // no longer receive events from the chat room
    if (
      pusherCurrentUser &&
      pusherCurrentUser.roomSubscriptions[this.state.roomId]
    )
      pusherCurrentUser.roomSubscriptions[this.state.roomId].cancel();

    // cancel initialise for when the Chat screen is openened and closed quickly
    if (this.rejectProm) {
      this.rejectProm();
      this.rejectProm = null;
    }
  }

  initialise(roomId: number, productUuid?: string) {
    const { userData } = this.props;
    let thisRoom;
    return new Promise((resolve, reject) => {
      // for development
      if (false) {
        // @anotherperson
        api
          .getUser('5a78d09e2d314a702698f957')
          .then(partner => this.setState({ partner }));
        // prod
        // thisRoom = {
        //   name: '5ac5ebcd939b7f1712b92baf-5ac5f22032eaae1c0b61ce1f',
        // };
        // local
        thisRoom = {
          name: getRoomName({
            buyer: { _id: userData._id },
            seller: { _id: '5a78d09e2d314a702698f957' },
          }),
        };
        return this.fetchOrders(thisRoom)
          .then(resolve)
          .catch(e => console.error(e));
      }
      if (!pusherCurrentUser) return reject('no pusherCurrentUser');
      this.rejectProm = reject;

      this.connectToPusher()
        .then(() => {
          // coming from ChatRooms or Push Notification
          if (roomId !== -1) {
            return pusherCurrentUser
              .joinRoom({ roomId })
              .then(room => {
                console.debug('1 Joined room ID:', room.id);
                thisRoom = room;
                return room;
              })
              .then(room =>
                api.getUser(room.userIds.find(id => id !== userData._id))
              )
              .then(partner => this.setState({ partner }))
              .catch(err => {
                console.log('Error joining room ID:', roomId);
                console.log(err);
              });
          }

          // coming from Product
          if (!productUuid) throw new Error('productUuid missing');

          return this.createOrder(productUuid)
            .then(o => o)
            .catch(({ message, data }) => {
              if (
                message == 'Duplicate order' &&
                data.data &&
                // TODO: check is 'paid' once payment is completed
                data.data.status == 'pending'
              ) {
                return data.data;
              }
            });
        })
        .then(o => {
          // console.debug(o);

          // joinable rooms are those you're not a member of
          return pusherCurrentUser
            .getJoinableRooms()
            .then((rooms: Array<any>) => {
              const allRooms = [...rooms, ...pusherCurrentUser.rooms];
              return allRooms.filter(r => r.name == getRoomName(o));
            })
            .then(rooms => {
              // console.debug(rooms);

              // check if there's a previouly a room created,
              // by a partner (seller) or my self
              if (rooms.length > 0) {
                const firstRoom = rooms[0].id;
                return pusherCurrentUser
                  .joinRoom({ roomId: firstRoom })
                  .then(room => {
                    roomId = room.id;
                    thisRoom = room;
                    console.debug('2 Joined room ID:', room.id);
                    return room;
                  })
                  .then(room =>
                    api.getUser(room.userIds.find(id => id !== userData._id))
                  )
                  .then(partner => this.setState({ partner }))
                  .catch(err => {
                    console.log('Error joining room ID:', firstRoom);
                    console.log(err);
                  });
              }

              // no existing room existed
              return pusherCurrentUser
                .createRoom({
                  name: getRoomName(o),
                  private: true,
                  addUserIds: [o.seller, userData._id],
                })
                .then(room => {
                  roomId = room.id;
                  thisRoom = room;
                  console.debug('Created room id', roomId);
                })
                .then(() => api.getUser(o.seller))
                .then(partner => this.setState({ partner }))
                .catch(err => {
                  console.log('Error creating room', err);
                });
            })
            .catch(err => {
              console.log(`Error getting joinable rooms: ${err}`);
            });
        })
        .then(() => this.setState({ roomId }))
        .then(() =>
          pusherCurrentUser.fetchMessages({
            roomId,
            direction: 'newer',
            limit: 100,
          })
        )
        .then(messages => {
          if (!this.state.partner) throw new Error('no partner');

          let newMsgs = [];
          for (let i = 0; i < messages.length; i++) {
            newMsgs.push(this.createGiftedMessage(messages[i]));
          }
          this.setState({ messages: newMsgs.reverse() });
          return messages[messages.length - 1];
        })
        .then(lastMsg => {
          if (!lastMsg) return;
          setTimeout(() => {
            pusherCurrentUser
              .setReadCursor({
                roomId,
                position: lastMsg.id,
              })
              .then(() => {
                // console.debug('setReadCursor success');
              })
              .catch(err => {
                console.log(`Error setting cursor: ${err}`);
              });
          }, MARK_AS_READ_AFTER_MS);
        })
        .then(() =>
          pusherCurrentUser.subscribeToRoom({
            roomId,
            hooks: { onNewMessage: this.newMessage },
            messageLimit: 0,
          })
        )
        .then(() => this.fetchOrders(thisRoom))
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }

  fetchOrders = (thisRoom: any) => {
    const { userData } = this.props;
    console.log('fetchOrders');
    return new Promise((resolve, reject) => {
      api
        .getOrders(userData.token)
        // show orders which are with the person I'm chatting with
        .then(orders =>
          orders.filter((o: Order) => getRoomName(o) == thisRoom.name)
        )
        // show orders which i have not archived
        // AND
        // show orders which i have not reviewed
        .then(orders =>
          orders.filter((o: Order) => {
            const iAmTheSeller = userData._id == o.seller._id;
            const iAmTheBuyer = userData._id == o.buyer._id;
            if (
              (iAmTheSeller && !o.archivedBySeller && !o.reviewFromSeller) ||
              (iAmTheBuyer && !o.archivedByBuyer && !o.reviewFromBuyer)
            ) {
              return o;
            }
          })
        )
        .then(orders => this.setState({ orders }))
        .then(() => resolve())
        .catch(e => reject(e));
    });
  };

  createOrder(uuid: string): Promise<Order | Error> {
    const { token } = this.props.userData;
    return new Promise((resolve, reject) => {
      api
        .post('/api/orders', { product: uuid }, { token })
        .then(res => resolve(res.data))
        .catch(err => reject(err));
    });
  }

  newMessage = (m: PusherMessage) => {
    const newMsg = this.createGiftedMessage(m);

    setTimeout(() => {
      pusherCurrentUser
        .setReadCursor({
          roomId: this.state.roomId,
          position: m.id,
        })
        .then(() => {
          // console.debug('setReadCursor success');
        })
        .catch(err => {
          console.log(`Error setting cursor: ${err}`);
        });
    }, MARK_AS_READ_AFTER_MS);

    if (this.state.messages && this.state.messages.length) {
      return this.setState(prevState => {
        return {
          messages: [newMsg, ...prevState.messages],
        };
      });
    }
    return this.setState({ messages: [newMsg] });
  };

  getPartner(): { _id: string, name: string, avatar: string } {
    const { partner }: { partner: UserData } = this.state;
    return {
      _id: partner._id,
      name: partner.username,
      avatar: partner.profilePic,
    };
  }

  connectToPusher = (): Promise<null> => {
    return new Promise(resolve => {
      resolve(null);
    });
  };

  createGiftedMessage(msg: PusherMessage): Message {
    const { userData } = this.props;
    const otherUser = this.getPartner();
    // if (m.sender) {
    const user = msg.senderId == userData._id ? userData : otherUser;
    // }
    // $FlowFixMe
    return {
      _id: msg.id,
      createdAt: new Date(msg.createdAt),
      text: msg.text,
      user: {
        _id: user._id,
        // $FlowFixMe
        name: user.username || user.name,
        // $FlowFixMe
        avatar: user.avatar || user.profilePic,
      },
      sent: msg.sent ? msg.sent : false,
      received: msg.received ? msg.received : false,
    };
  }

  createGiftedSystemMessage(msg: PusherMessage) {
    return {
      _id: msg.id,
      createdAt: new Date(msg.createdAt),
      text: msg.message,
      system: true,
    };
  }

  onSend = (messages: Array<Message>) => {
    const { text } = messages[0];

    pusherCurrentUser
      .sendMessage({ text, roomId: this.state.roomId })
      .then(id => {
        // console.debug('Message sent:', id);
      })
      .catch(err => {
        console.error(err);
      });
  };

  renderSystemMessage(props): React$Element<*> {
    return (
      <SystemMessage
        {...props}
        containerStyle={st.systemContainer}
        textStyle={st.systemText}
      />
    );
  }

  renderSend(props): React$Element<*> {
    const showActiveOpacity = props.text.trim().length > 0;
    return (
      <View style={st.send}>
        <Send {...props}>
          <Ionicons
            // eslint-disable-next-line
            style={{ opacity: showActiveOpacity ? 1 : 0.7 }}
            name="md-send"
            size={29}
          />
        </Send>
      </View>
    );
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

  /*
  renderActions(props: any) {
    if (Platform.OS === 'ios') {
      return <ChatActions {...props} />;
    }
    const options = {
      'Action 1': (props: any) => {
        console.warn('option 1', props);
      },
      'Action 2': (props: any) => {
        console.warn('option 2', props);
      },
      Cancel: () => {},
    };
    return <Actions {...props} options={options} />;
  }
  */

  goToProfile = () => {
    const { partner } = this.state;
    const { _id } = this.props.userData;

    let routeName = 'profileInStack';
    if (_id == partner._id) {
      routeName = 'profile';
    }

    const navigateToProfile = NavigationActions.navigate({
      routeName,
      params: partner,
      key: `profile-${partner.username}`,
    });

    this.props.navigation.dispatch(navigateToProfile);
  };

  renderBubble = props => (
    <Bubble
      {...props}
      messageTextProps={{
        linkStyle: {
          right: { color: 'red' },
          left: { color: 'red' },
        },
      }}
      textStyle={{
        right: { color: colors.black },
      }}
      wrapperStyle={{
        left: {
          backgroundColor: colors.white,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.grey3,
        },
        right: { backgroundColor: colors.grey5 },
      }}
    />
  );

  goToAddReviewOrCancel(orderId: string) {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'addReview',
      // hack https://github.com/react-navigation/react-navigation/issues/1416#issuecomment-300489310
      params: { orderId, shouldRefresh: this.shouldRefresh.bind(this) },
      key: `addReview-${orderId}`,
    });
  }

  _renderOrderCircle = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={st.orderCircle}
      onPress={() => this.goToAddReviewOrCancel(item.id)}>
      <Image
        style={st.itemImage}
        source={{
          uri: item.product.photoURIs[0].replace('.jpg', '-thumb.jpg'),
        }}
      />
    </TouchableOpacity>
  );

  _keyExtractor = (item): number => item.id;

  _renderSeparatorHorizontal = () => <View style={st.separatorHorizontal} />;

  render() {
    const { navigation, userData } = this.props;
    const { messages, isLoading, partner, orders } = this.state;

    return (
      <Container style={st.flex1}>
        <Header>
          <Left style={st.containerHeader}>
            <NBButton transparent dark onPress={() => navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={st.containerHeader}>
            {!isLoading &&
              partner && (
                <Title
                  style={{ color: colors.black }}
                  onPress={this.goToProfile}>
                  @{partner.username}
                </Title>
              )}
          </Body>
          <Right />
        </Header>
        <View style={st.flex1}>
          {isLoading ? (
            <View style={st.container}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View style={st.flex1}>
              <View style={st.orderCirclesContainer}>
                {orders.length > 0 && (
                  <FlatList
                    data={orders}
                    keyExtractor={this._keyExtractor}
                    horizontal
                    ItemSeparatorComponent={this._renderSeparatorHorizontal}
                    renderItem={this._renderOrderCircle}
                  />
                )}
              </View>
              <GiftedChat
                messages={messages}
                onSend={m => this.onSend(m)}
                placeholder={I18n.t('chat.send_msg_placeholder')}
                // placeholder={I18n.t('chat.typeAMessage')}
                user={{
                  _id: userData._id,
                  name: userData.username,
                  avatar: userData.profilePic,
                  //   userData.profilePic !== null ? userData.profilePic : null,
                }}
                // locale=""
                // timeformat="LT"
                // dateformat="ll"
                // onPressAvatar={() => alert('code me like those french girls 🎨')}
                renderSend={this.renderSend}
                renderSystemMessage={this.renderSystemMessage}
                renderBubble={this.renderBubble}
                // parsePatterns={(linkStyle) => [
                //   {type: 'url', style: linkStyle, onPress: this.onUrlPress},
                //   {type: 'phone', style: linkStyle, onPress: this.onPhonePress},
                //   {type: 'email', style: linkStyle, onPress: this.onEmailPress},
                //   ]}
                // renderActions={this.renderActions}
                // keyboardShouldPersistTaps="handled"
                maxInputLength={settings.MAX_CHAT_INPUT_LENGTH}
                // renderInputToolbar={this.renderInputToolbar}
                // renderAvatar={null}
              />
            </View>
          )}
        </View>
      </Container>
    );
  }
}

/**
 * the room name is generated alphatically between the userIds.
 *
 * this is to create a unique ID between the two users for both way purchases.
 */
export function getRoomName(o: Order): string {
  let ids;
  if (o.buyer._id && o.seller._id) {
    ids = [o.buyer._id, o.seller._id];
  } else {
    ids = [o.buyer, o.seller];
  }
  return ids.sort().join('-');
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerHeader: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  orderCirclesContainer: {
    height: 50 + 16 + 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey5,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  send: {
    marginBottom: 5,
    marginRight: 10,
    justifyContent: 'center',
    height: '100%',
  },
  systemContainer: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    borderColor: colors.active,
    marginVertical: 15,
    marginHorizontal: 65,
    padding: 5,
  },
  systemText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '400',
  },
  separatorHorizontal: {
    width: 1,
  },
  orderCircle: {
    margin: 4,
  },
  itemImage: {
    // borderRadius: 50, // FIXME:
    height: 50,
    width: 50,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Chat = connect(mapStateToProps)(ChatContainer);
