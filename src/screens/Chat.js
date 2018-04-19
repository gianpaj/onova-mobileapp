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
import { PUSHER_INSTANCE, PUSHER_TOKEN_PROVIDER } from 'react-native-dotenv';

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

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  hasRendered: boolean,
  interlocutor?: UserData,
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
    interlocutor: null,
    isLoading: true,
    isTyping: false,
    messages: [],
    roomId: -1,
  };

  componentWillMount() {
    const { params } = this.props.navigation.state;
    const { userData } = this.props;

    // for development
    if (!params) {
      const orderId = '5ad67c508b10227b456bfc05';
      const product_uuid = 'ryq8-tjUM';
      const roomId = 6703904;

      return this.getTempUserId('firstperson').then(userId => {
        this.initialise(orderId, product_uuid, userId, roomId);
      });
    // coming from Checkout
    if (params.createRoom) {
      // TODO: check if room doesn't not exist already
      const { orderId, productUuid, userId } = params;
      this.currentUser
        .createRoom({
          name: 'temp-name',
          private: true,
          addUserIds: [userId, userData._id],
        })
        .then(room => {
          console.debug(`Created room called`, room);
          this.initialise(orderId, productUuid, userId, room.id);
        })
        .catch(err => {
          console.log('Error creating room', err);
        });
    } else {
      console.log(params);
      // coming else from ChatRooms
      const { orderId, productUuid, userId, roomId } = params;
      // TODO: check show is the seller/buyer!
      this.initialise(orderId, productUuid, userId, roomId);
    }
  }

  componentWillUnmount() {
    this.currentUser.roomSubscriptions[this.state.roomId].cancel();
  }

  _getInterlucutorUserData(userId: string): Promise<null | any> {
    return new Promise((resolve, reject) => {
      api
        .get(`/api/users/${userId}`)
        .then(interlocutor => {
          console.debug(interlocutor);
          this.setState({ interlocutor });
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

  initialise(
    orderId: string,
    productUuid: string,
    userId: string,
    roomId: number
  ) {
    const Promises = [];
    Promises.push(this.fetchProduct(productUuid));
    Promises.push(this.fetchOrder(orderId));
    this._getInterlucutorUserData(userId)
      .then(() => {
        Promises.push(
          this.connectToPusher()
            .then(() => this.currentUser.joinRoom({ roomId }))
            .then(() => this.setState({ isLoading: true }))
            .then(() => {
              const o = this.state.order;
              this.currentUser.updateRoom({
                roomId,
                name: `${o.buyer._id}-${o.seller._id}`,
                // private: true,
              });
              return this.setState({ roomId });
            })
            .then(() =>
              this.currentUser.subscribeToRoom({
                roomId,
                hooks: {
                  onNewReadCursor: cursor => console.log(cursor),
                  onNewMessage: this.newMessage,
                },
                messageLimit: 100,
              })
            )
        );

        Promise.all(Promises)
          .then(() => {
            this.setState({ hasRendered: true, isLoading: false });
          })
          .catch(err => console.error(err));
      })
      .catch(err => console.error(err));
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
    const { interlocutor: int } = this.state;
    return {
      _id: int._id,
      name: int.username,
      avatar: int.profilePic,
    };
  }

  connectToPusher = (): Promise<Error | PusherUser> => {
    console.log('connectToPusher');
    const { userData } = this.props;
    return new Promise((resolve, reject) => {
      const chatManager = new ChatManager({
        instanceLocator: PUSHER_INSTANCE,
        userId: userData._id,
        tokenProvider: new TokenProvider({
          url: PUSHER_TOKEN_PROVIDER,
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
    const { interlocutor } = this.state;

    if (!interlocutor) return;

    const navigateToProfile = NavigationActions.navigate({
      routeName: 'profile',
      params: interlocutor,
      key: `profile-${interlocutor.username}`,
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
    const { messages, isLoading, interlocutor, product, order } = this.state;

    if (!product || !order) return null;

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
              interlocutor && (
                <Title onPress={this.goToProfile}>
                  @{interlocutor.username}
                </Title>
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
              <CardItem header>
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
              </CardItem>
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
