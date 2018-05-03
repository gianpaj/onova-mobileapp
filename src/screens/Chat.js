// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// prettier-ignore
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Button as NBButton,
  CardItem,
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
import { GiftedChat, Bubble, SystemMessage } from 'react-native-gifted-chat';
import { ChatManager, TokenProvider } from '@pusher/chatkit/react-native';

import type { NavigationScreenProp } from 'react-navigation';

import { Send } from '../components';
import type {
  Message,
  Order,
  Product,
  ReduxState,
  PusherMessage,
  PusherUser,
  UserData,
  // eslint-disable-next-line
} from '../types';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';

const MARK_AS_READ_AFTER_MS = 300;
let config;

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  hasRendered: boolean,
  partner?: UserData,
  isLoading: boolean,
  isTyping: boolean,
  messages?: Array<Message>,
  order?: Order,
  product?: Product,
  roomId: number,
};

class ChatContainer extends Component<Props, State> {
  currentUser: PusherUser;
  sb;

  state = {
    hasRendered: false,
    partner: null,
    isLoading: true,
    isTyping: false,
    messages: [],
    roomId: -1,
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
    const { params } = this.props.navigation.state;

    // for development
    if (!params) {
      // const orderId = '5ad67c508b10227b456bfc05';
      const product_uuid = 'ryq8-tjUM';
      const roomId = 6703904;

      return this.getTempUserId('firstperson').then(userId => {
        this.initialise(product_uuid, userId, roomId);
      });
    }
    console.log(params);
    // coming from Checkout
    // OR
    // coming from ChatRooms
    const { productUuid, userId, roomId } = params;
    // TODO: check show is the seller/buyer!
    this.initialise(productUuid, userId, roomId);
  }

  componentWillUnmount() {
    if (this.currentUser.roomSubscriptions) {
      console.log(this.currentUser.roomSubscriptions);
    }
    // this.currentUser.roomSubscriptions[this.state.roomId].cancel();
  }

  _getPartner(userId: string): Promise<null | any> {
    return new Promise((resolve, reject) => {
      api
        .get(`/api/users/${userId}`)
        .then(partner => {
          console.debug(partner);
          this.setState({ partner });
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  fetchProduct(uuid: string): Promise<Product> {
    return new Promise((resolve, reject) => {
      return api
        .get(`/api/products/${uuid}`)
        .then(({ data }) => {
          console.debug(data);
          this.setState({ product: data });
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  fetchOrder(uuid: string): Promise<Order> {
    const { token } = this.props.userData;
    return new Promise((resolve, reject) => {
      return api
        .get(`/api/orders/${uuid}`, { token })
        .then(({ data: order }) => {
          console.debug(order);
          this.setState({
            order,
          });
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  getTempUserId(username: string): Promise<string> {
    return new Promise((resolve, reject) => {
      api
        .get('/api/users/')
        .then((res: Array<UserData>) => {
          const user = res.filter(u => u.username == username);
          resolve(user[0]._id);
        })
        .catch(err => reject(err));
    });
  }

  initialise(productUuid: string, userId: string, roomId: number) {
    const { userData } = this.props;
    let o;
    this.fetchProduct(productUuid)
      .then(() =>
        this.createOrder(productUuid)
          .then(o => o)
          .catch(err => {
            if (
              err.message == 'Duplicate order' &&
              err.data.data &&
              // TODO: set to 'paid' once payment is completed
              err.data.data.status == 'pending'
            ) {
              return err.data.data;
            }
          })
      )
      .then(newo => (o = newo))
      .then(() => this._getPartner(userId))
      .then(() => this.connectToPusher())
      .then(() => {
        console.log(roomId);

        if (roomId !== -1) {
          return this.currentUser
            .joinRoom({ roomId })
            .then(room => {
              console.log(`Joined room with ID: ${room.id}`);
            })
            .catch(err => {
              console.log(`Error joining room ${roomId}`);
              console.log(err);
            });
        } else {
          // coming from checkout
          // check if there's a room created by partner
          // i.e. previous room created by the, now, seller

          console.log(o);
          // joinable rooms are those you're not a member of
          return this.currentUser
            .getJoinableRooms()
            .then((rooms: Array<any>) => {
              const allRooms = [...rooms, ...this.currentUser.rooms];
              return allRooms.filter(r => r.name == getRoomName(o));
            })
            .then(rooms => {
              console.log(rooms);
              if (rooms.length > 0) {
                const firstRoom = rooms[0].id;
                return this.currentUser
                  .joinRoom({ roomId: firstRoom })
                  .then(room => {
                    roomId = room.id;
                    console.log(`Joined room with ID: ${room.id}`);
                  })
                  .catch(err => {
                    console.log(`Error joining room ${firstRoom}`);
                    console.log(err);
                  });
              }
              return this.currentUser
                .createRoom({
                  name: getRoomName(o),
                  private: true,
                  addUserIds: [userId, userData._id],
                })
                .then(room => {
                  roomId = room.id;
                  console.debug('Created room id', roomId);
                })
                .catch(err => {
                  console.log('Error creating room', err);
                });
            })
            .catch(err => {
              console.log(`Error getting joinable rooms: ${err}`);
            });
        }
      })
      .then(() => this.setState({ isLoading: true, roomId }))
      .then(() => {
        this.currentUser.subscribeToRoom({
          roomId,
          hooks: {
            onNewReadCursor: cursor => console.log(cursor),
            onNewMessage: this.newMessage,
          },
          messageLimit: 100,
        });
      })
      .then(() => {
        this.setState({ hasRendered: true, isLoading: false });
      })
      .catch(err => console.error(err));
  }

  createOrder(uuid: string): Promise<Order> {
    const { token } = this.props.userData;
    return new Promise((resolve, reject) => {
      api
        .post('/api/orders', { product: uuid }, { token })
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  newMessage = (m: PusherMessage) => {
    //   // if (m.sender) {
    const newMsg = this.createGiftedMessage(m);
    // console.log(newMsg);
    // }

    // TODO: Update cursor if the message was read

    if (this.state.messages && this.state.messages.length) {
      return this.setState(prevState => {
        return {
          messages: [newMsg, ...prevState.messages],
        };
      });
    }
    return this.setState({ messages: [newMsg] });
  };

  getPartner(): any {
    const { partner } = this.state;
    return {
      _id: partner._id,
      name: partner.username,
      avatar: partner.profilePic,
    };
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
        .then(currentUser => {
          this.currentUser = currentUser;
          resolve(currentUser);
        })
        .catch(err => reject(err));
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
    const text = messages[0].text;

    this.currentUser
      .sendMessage({
        text,
        roomId: this.state.roomId,
      })
      .then(id => {
        console.log('Message sent:', id);
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
      <Send {...props}>
        <View style={st.send}>
          <Ionicons
            // eslint-disable-next-line
            style={{ opacity: showActiveOpacity ? 1 : 0.7 }}
            name="md-send"
            size={29}
          />
        </View>
      </Send>
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

    if (!partner) return;

    const navigateToProfile = NavigationActions.navigate({
      routeName: 'profile',
      params: partner,
      key: `profile-${partner.username}`,
    });

    this.props.navigation.dispatch(navigateToProfile);
  };

  renderBubble = props => {
    return (
      <Bubble
        {...props}
        textStyle={{
          right: {
            color: colors.black,
          },
        }}
        wrapperStyle={{
          left: {
            backgroundColor: colors.sLight,
          },
          right: {
            backgroundColor: colors.pLight,
          },
        }}
      />
    );
  };

  render() {
    const { navigation, userData } = this.props;
    const { messages, isLoading, partner, product } = this.state;

    if (!product) return null;

    return (
      <Container style={st.flex1}>
        <Header>
          <Left>
            <NBButton transparent dark onPress={() => navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body>
            {!isLoading &&
              partner && (
                <Title onPress={this.goToProfile}>@{partner.username}</Title>
              )}
          </Body>
          <Right>
            <NBButton
              transparent
              style={{ backgroundColor: colors.transparent }}
              onPress={this.goToProfile}>
              <FontAwesome name="user-circle" size={28} />
            </NBButton>
          </Right>
        </Header>
        <View style={st.flex1}>
          {isLoading ? (
            <View style={st.container}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View style={st.flex1}>
              {/* <CardItem header>
                <Text
                  numberOfLines={1} // android
                  style={{ width: '50%', top: -1.5 }}>
                  description: {product.description}
                </Text>
                <View style={st.row}>
                  <Text>order status: {order.status}</Text>
                  <NBButton
                    transparent
                    style={{ height: 20 }}
                    onPress={() =>
                      Platform('code me like those french girls 🎨')
                    }>
                    <NBIcon name="ios-information-circle-outline" />
                  </NBButton>
                </View>
              </CardItem> */}
              <GiftedChat
                messages={messages}
                onSend={m => this.onSend(m)}
                placeholder="Type a message"
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
                // renderLoading={() => ()}
                renderSend={this.renderSend}
                renderSystemMessage={this.renderSystemMessage}
                renderBubble={this.renderBubble}
                // renderActions={this.renderActions}
                // keyboardShouldPersistTaps="handled"
                maxInputLength={settings.MAX_CHAT_INPUT_LENGTH}
                // renderInputToolbar={this.renderInputToolbar}
                showUserAvatar
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
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  send: {
    marginBottom: 5,
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
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Chat = connect(mapStateToProps)(ChatContainer);
