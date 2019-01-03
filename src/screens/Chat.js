// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
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
import Dialog from 'react-native-dialog';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationActions } from 'react-navigation';
import { GiftedChat, Bubble, SystemMessage } from 'react-native-gifted-chat';

import { currentUser as pusherCurrentUser } from '../actions/actionCreator';
import I18n from '../i18n';

import type { NavigationScreenProp } from 'react-navigation';

import { Header, Send, Info } from '../components';
import ChatActions from '../components/ChatActions';
import MessageImage from '../components/MessageImage';

import type { Order, ReduxState, PusherMessage, UserData } from '../types';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';

const MARK_AS_READ_AFTER_MS = 300;
const ONOVA_BOT_ID = '5bd1f7af46c62e6cdee546d0';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  dialogVisible: boolean,
  partner: UserData,
  isLoading: boolean,
  // isTyping: boolean,
  messages: Array<PusherMessage>,
  orders: Array<Order>,
  roomId: number,
  shouldRefresh: boolean,
  uploadingImage: boolean,
};

class ChatContainer extends Component<Props, State> {
  sb;
  rejectProm;

  state = {
    dialogVisible: false,
    partner: null,
    isLoading: true,
    // isTyping: false,
    orders: [],
    messages: [],
    roomId: -1,
    shouldRefresh: false,
    uploadingImage: false,
  };

  componentDidMount() {
    let { params } = this.props.navigation.state;

    // refresh after leaving a review or archiving an order
    this.props.navigation.addListener('willFocus', () => {
      const { roomId, shouldRefresh } = this.state;
      // do not initiate twice at the beginning
      // OR
      // when it should not refresh (review hasn't been added or order archived)
      if (!roomId || !shouldRefresh) return;

      // TODO: maybe only refresh the orders?
      // this.fetchOrders(thisRoom)

      this.setState({ isLoading: true }, () =>
        this.initialise(roomId)
          .then(this.setState({ isLoading: false, shouldRefresh: false }))
          .catch(e => console.error(e))
      );
    });

    // for development on 'onova' Pusher Instance
    if (!params) {
      // for development on 'onova-test' Pusher Instance (local env)
      params = { roomId: 19372253 };
      // for prod between Alex-Gian
      // params = { roomId: 16463859 };
    }

    this.initialise(params.roomId, params.orderId)
      .then(() => this.setState({ isLoading: false }))
      .catch(err => {
        if (err && err.message !== 'no partner') console.error(err);
      });
  }

  shouldRefresh(shouldRefresh: boolean) {
    this.setState({ shouldRefresh });
  }

  componentWillUnmount() {
    // stop receiving events from the chat room
    if (
      pusherCurrentUser &&
      pusherCurrentUser.roomSubscriptions[this.state.roomId]
    )
      pusherCurrentUser.roomSubscriptions[this.state.roomId].cancel();

    // cancel initialise(). i.e. when the Chat screen is opened and closed quickly
    if (this.rejectProm) {
      this.rejectProm();
      this.rejectProm = null;
    }
  }

  initialise(roomId: number, orderId?: string) {
    const { userData } = this.props;
    let thisRoom;
    return new Promise((resolve, reject) => {
      if (!pusherCurrentUser) return reject('no pusherCurrentUser');
      if (!orderId && !roomId) return reject('orderId and roomId are missing');
      this.rejectProm = reject;

      this.connectToPusher()
        .then(() => {
          // coming from ChatRooms or a Push Notification
          if (roomId) {
            return pusherCurrentUser
              .joinRoom({ roomId })
              .then(room => {
                console.debug('1 Joined room ID:', room.id);
                thisRoom = room;
                return room;
              })
              .then(room =>
                api.getUser(
                  room.userIds
                    .filter(id => id !== ONOVA_BOT_ID)
                    .find(id => id !== userData._id)
                )
              )
              .then(partner => this.setState({ partner }))
              .catch(err => {
                console.log('Error joining room ID:', roomId);
                reject(err);
              });
          }

          return api.getOrder(orderId, this.props.token);
        })
        .then(o => {
          // skip if coming from ChatRooms
          if (roomId) return;

          console.debug(o);

          // else join an existing room or create one

          // joinable rooms are those you're not a member of
          return pusherCurrentUser
            .getJoinableRooms()
            .then((rooms: Array<any>) => {
              const allRooms = [...rooms, ...pusherCurrentUser.rooms];
              return allRooms.filter(r => r.name == getRoomName(o));
            })
            .then(rooms => {
              // console.debug(rooms);

              // check if there's a previously created room,
              // by a partner (seller) or myself
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
                    api.getUser(
                      room.userIds
                        .filter(id => id !== ONOVA_BOT_ID)
                        .find(id => id !== userData._id)
                    )
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
                  addUserIds: [o.buyer._id, userData._id],
                })
                .then(room => {
                  roomId = room.id;
                  thisRoom = room;
                  console.debug('Created room id', roomId);
                })
                .then(() => api.getUser(o.buyer._id))
                .then(partner => this.setState({ partner }))
                .catch(err => {
                  console.log('Error creating room');
                  reject(err);
                });
            })
            .catch(err => {
              console.log('Error getting joinable rooms');
              reject(err);
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
        .then(async messages => {
          if (!this.state.partner) throw new Error('no partner');

          const newMsgs = messages.map(m => this.createGiftedMessage(m));
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
    const { userData, token } = this.props;
    console.log('fetchOrders');
    return new Promise((resolve, reject) => {
      api
        .getOrders(token)
        // show orders which are with the person I'm chatting with
        .then(orders =>
          orders.filter((o: Order) => getRoomName(o) == thisRoom.name)
        )
        .then(orders =>
          orders.filter(
            (o: Order) => o.status !== 'cancelled' && o.status !== 'pending'
          )
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
    this.setState({ messages: [newMsg] });
  };

  getPartner(): { _id: string, name: string, avatar: string } {
    const { partner }: { partner: UserData | any } = this.state;
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

  createGiftedMessage(msg: PusherMessage): PusherMessage {
    const { userData } = this.props;
    if (msg.senderId === ONOVA_BOT_ID) {
      return this.createGiftedSystemMessage(msg);
    }
    const otherUser = this.getPartner();
    const user = msg.senderId == userData._id ? userData : otherUser;
    const message = {
      _id: msg.id,
      createdAt: new Date(msg.createdAt),
      text: msg.text,
      user: {
        _id: user._id,
        name: user.username || user.name,
        avatar: user.avatar || user.profilePic,
      },
      sent: msg.sent ? msg.sent : false,
      received: msg.received ? msg.received : false,
    };

    if (msg.attachment) {
      return {
        ...message,
        image: msg.attachment,
      };
    }
    return message;
  }

  createGiftedSystemMessage(msg: PusherMessage) {
    return {
      _id: msg.id,
      createdAt: new Date(msg.createdAt),
      text: msg.text,
      system: true,
    };
  }

  onSend = async (messages: Array<PusherMessage>) => {
    if (messages[0].text) {
      const { text } = messages[0];

      pusherCurrentUser
        .sendMessage({ text, roomId: this.state.roomId })
        .then(() => {
          // console.debug('Message sent:', id);
        })
        .catch(err => {
          console.error(err);
        });
    } else {
      const { token } = this.props;

      this.setState({ uploadingImage: true });
      // Sending Images via Pusher
      // pusherCurrentUser
      //   .sendMessage({
      //     text: ' ', // cannot be empty string or null
      //     roomId: this.state.roomId,
      //     attachment: {
      //       file: {
      //         uri: messages[0].image,
      //         type: 'image/jpeg',
      //         name: 'image.jpg',
      //       },
      //       name: 'myfile.jpg',
      //     },
      //   })
      // Sending Images via our API
      try {
        const res = await api.sendChatPhoto(
          {
            uri: messages[0].image,
            type: 'image/jpeg',
            name: 'photo.jpg',
          },
          token
        );
        pusherCurrentUser
          .sendMessage({
            text: ' ', // cannot be empty string or null
            roomId: this.state.roomId,
            attachment: {
              type: 'image',
              link: res['thumb.jpeg'].path,
            },
          })
          .then(id => {
            console.debug('Image message sent:', id);
          })
          .catch(err => {
            console.error(err);
          })
          .then(() => {
            this.setState({ uploadingImage: false });
          });
      } catch (err) {
        console.error(err);
      }
    }
  };

  renderSystemMessage = (props): React$Element<*> => (
    <SystemMessage
      {...props}
      containerStyle={st.systemContainer}
      textStyle={st.systemText}
    />
  );

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

  renderActions = (props: any) => (
    <ChatActions {...props} uploadingImage={this.state.uploadingImage} />
  );

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

  renderBubble = props => {
    // this prevent the <MessageText /> from rendering when an image has been sent
    props.currentMessage.text = props.currentMessage.text.trim();

    return (
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
  };

  goToAddReviewOrArchiveOrder(orderId: string) {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'addReview',
      // hack https://github.com/react-navigation/react-navigation/issues/1416#issuecomment-300489310
      params: { orderId, shouldRefresh: this.shouldRefresh.bind(this) },
      key: `addReview-${orderId}`,
    });
  }

  _renderOrderSquare = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={st.orderSquare}
      onPress={() => this.goToAddReviewOrArchiveOrder(item.id)}>
      <Image
        style={st.itemImage}
        source={{
          uri: item.product.photoURIs[0].replace('.jpg', '-thumb.jpg'),
        }}
      />
    </TouchableOpacity>
  );

  _keyExtractor = (item): string => item.id;

  _renderSeparatorHorizontal = () => <View style={st.separatorHorizontal} />;

  toggleDialog = () =>
    this.setState(prevState => ({ dialogVisible: !prevState.dialogVisible }));

  renderInfoDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.dialogVisible}
        onBackdropPress={this.toggleDialog}
        onBackButtonPress={this.toggleDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Title>{I18n.t('chat.alert_info_title')}</Dialog.Title>

        <Text style={{ marginTop: 4, margin: 18 }}>
          {I18n.t('chat.alert_info_body')}
        </Text>
        <Dialog.Button
          label={I18n.t('product.toast_warning_ok_button')}
          onPress={this.toggleDialog}
        />
      </Dialog.Container>
    </React.Fragment>
  );

  render() {
    const { navigation, userData } = this.props;
    const { messages, isLoading, partner, orders } = this.state;

    if (isLoading) {
      return (
        <View style={st.container}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <Container style={st.flex1}>
        <Header>
          <Left style={st.containerHeader}>
            <NBButton transparent dark onPress={() => navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={st.flex2AndCenter}>
            {partner && (
              <>
                {/* // eslint-disable-next-line react-native/no-raw-text */}
                <Title
                  style={{
                    color: colors.black,
                    marginLeft: 22,
                    marginRight: 5,
                  }}
                  // eslint-disable-next-line react-native/no-raw-text
                  onPress={this.goToProfile}>
                  @{partner.username}
                </Title>
                <Info onPress={this.toggleDialog} />
              </>
            )}
          </Body>
          <Right />
        </Header>
        <View style={st.flex1}>
          <View style={st.orderSquaresContainer}>
            <FlatList
              data={orders}
              keyExtractor={this._keyExtractor}
              horizontal
              contentContainerStyle={{ flexGrow: 1 }}
              ItemSeparatorComponent={this._renderSeparatorHorizontal}
              renderItem={this._renderOrderSquare}
              ListEmptyComponent={() => (
                <Text style={st.noOrders}>{I18n.t('chat.no_orders')}</Text>
              )}
            />
          </View>
          <GiftedChat
            messages={messages}
            onSend={this.onSend}
            placeholder={I18n.t('chat.send_msg_placeholder')}
            user={{
              _id: userData._id,
              name: userData.username,
              avatar: userData.profilePic,
            }}
            // locale=""
            // timeformat="LT"
            // dateformat="ll"
            renderSend={this.renderSend}
            renderSystemMessage={this.renderSystemMessage}
            renderBubble={this.renderBubble}
            renderMessageImage={props => <MessageImage {...props} />}
            // parsePatterns={linkStyle => [
            //   {
            //     pattern: /: (\w+)/,
            //     style: { ...linkStyle, color: 'darkorange' },
            //     onPress: this.onUrlPress,
            //   },
            //   // {type: 'phone', style: linkStyle, onPress: this.onPhonePress},
            //   // {type: 'email', style: linkStyle, onPress: this.onEmailPress},
            // ]}
            renderActions={this.renderActions}
            // keyboardShouldPersistTaps="handled"
            maxInputLength={settings.MAX_CHAT_INPUT_LENGTH}
            // renderInputToolbar={this.renderInputToolbar}
            // renderAvatar={null}
          />
        </View>
        {this.renderInfoDialog()}
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
  flex2AndCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    flexDirection: 'row',
  },
  containerHeader: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  orderSquaresContainer: {
    height: 50 + 16 + 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey5,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  orderSquare: {
    borderBottomWidth: 2,
    borderColor: colors.active,
    marginBottom: 3,
  },
  noOrders: {
    alignSelf: 'center',
    color: colors.grey3,
    flex: 1,
    textAlign: 'center',
  },
  flex1: {
    flex: 1,
  },
  send: {
    marginBottom: 10,
    marginRight: 10,
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
    textAlign: 'center',
  },
  separatorHorizontal: {
    width: 1,
  },
  itemImage: {
    // borderRadius: 50, // FIXME:
    height: 50,
    width: 50,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const Chat = connect(mapStateToProps)(ChatContainer);
