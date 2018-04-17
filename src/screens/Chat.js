// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// prettier-ignore
import {
  ActivityIndicator,
  Alert,
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
import SendBird from 'sendbird';
import { GiftedChat, Bubble, SystemMessage } from 'react-native-gifted-chat';
import type { NavigationScreenProp } from 'react-navigation';

// import { sbCreateOpenChannelListQuery } from '../actions/sendbird';
import { Send } from '../components';
import type {
  Message,
  Order,
  Product,
  ReduxState,
  SendBirdMessage,
  UserData,
} from '../types';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';

const MARK_AS_READ_AFTER_MS = 300;

type Channel = {
  createPreviousMessageListQuery: () => void,
  refresh: () => void,
  sendUserMessage: (
    message: string,
    data: string,
    (msg: any, err: any) => void
  ) => void,
  url: string,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  channel: Channel | null,
  hasRendered: boolean,
  isLoading: boolean,
  isTyping: boolean,
  lastMessage?: Message,
  messageQuery: any,
  messages: Array<Message> | null,
  interlocutor: UserData | null,
  product?: Product,
  order?: Order,
};

class ChatContainer extends Component<Props, State> {
  sb;

  state = {
    channel: null,
    hasRendered: false,
    isLoading: false,
    isTyping: false,
    messageQuery: null,
    messages: null,
    interlocutor: null,
  };

  componentWillMount() {
    const { params } = this.props.navigation.state;

    console.log(params);

    // for development
    if (!params) {
      const orderId = '5a90077ff298522a0eddde0a';
      const productId = '';

      this.getTempUserId('firstperson').then(userId => {
        this.initialise(orderId, productId, userId);
      });
    } else {
      // coming from Checkout or ChatRooms
      const { orderId, productId, userId } = params;
      // TODO: check show is the seller/buyer!
      this.initialise(orderId, productId, userId);
    }
  }

  componentWillUnmount() {
    this.sb.removeChannelHandler('ChatView');
    this.sb.removeConnectionHandler('ChatView');
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
        .then(({ data }) => {
          console.debug(data);
          this.setState({ order: data });
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
          console.debug(res);
          const user = res.filter(u => u.username == username);
          resolve(user[0]._id);
        })
        .catch(err => reject(err));
    });
  }

  initialise(orderId: string, productId: string, userId: string) {
    this._getInterlucutorUserData(userId)
      .then(() => {
        const Promises = [];
        Promises.push(this.fetchProduct(productId));
        Promises.push(this.fetchOrder(orderId));
        Promises.push(this.connectToSendBird(orderId));

        Promise.all(Promises)
          .then(() => {
            this.setState({ hasRendered: true, isLoading: false });
          })
          .catch(err => console.error(err));
      })
      .catch(err => console.error(err));
  }

  /**
   * Connect to SendBird and set the orderId as metadata
   *
   * @param {*} orderId metadata for channel
   */
  connectToSendBird(orderId: string): Promise<null | any> {
    return new Promise((resolve, reject) => {
      // TODO: remove this if don't get a warning when quickly opening a chat thread.
      // Maybe from a deeplink, opening app from background?
      setTimeout(() => {
        this.sb = SendBird.getInstance();
        if (!this.state.hasRendered) {
          this.sb.connect(this.props.userData._id, (user, err) => {
            if (err) return reject(err);

            console.debug(user);

            this.createRoomAndGetMessages(this.state.interlocutor._id, orderId);

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
        } else {
          console.warn('sendbird not initiated OR hasRendered is true');
        }
      }, 500);
    });
  }

  createChannelHandler(): any {
    const { interlocutor: int, channel } = this.state;

    const ChannelHandler = new this.sb.ChannelHandler();

    // fat-arrow necessary to pass `this` context
    ChannelHandler.onMessageReceived = (
      receivedChannel: Channel,
      msg: SendBirdMessage
    ): void => {
      if (channel && receivedChannel.url !== channel.url) {
        console.log('Channel urls do not match');
      }

      if (!int) return console.error('err');

      const user = {
        _id: int._id,
        name: int.username,
        avatar: !int.profilePic ? null : int.profilePic,
      };

      const giftedMsg = this.createGiftedMessage(msg, user);

      this.setState(prevState => ({
        messages: GiftedChat.append(prevState.messages, giftedMsg),
      }));

      setTimeout(() => {
        // $FlowFixMe
        this.state.channel.markAsRead();
      }, MARK_AS_READ_AFTER_MS);
    };

    // ChannelHandler.onTypingStatusUpdated = channel => {
    //   console.log(channel);
    // };
    return ChannelHandler;
  }

  createGiftedMessage(msg: SendBirdMessage, user: UserData | any): Message {
    // $FlowFixMe
    return {
      _id: msg.messageId,
      createdAt: new Date(msg.createdAt),
      text: msg.message,
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

  createGiftedSystemMessage(msg: SendBirdMessage) {
    return {
      _id: msg.messageId,
      createdAt: new Date(msg.createdAt),
      text: msg.message,
      system: true,
    };
  }

  onSend = (messages: Array<Message>) => {
    const { userData } = this.props;

    if (this.state.channel) {
      const text = messages[0].text;
      this.state.channel.sendUserMessage(
        text,
        this.state.order.id,
        (msg: SendBirdMessage, err) => {
          if (err) {
            // profanity filter
            if (err.code == 900060) {
              return Alert.alert(
                'Message blocked by profanity filter',
                'If you think this is an error please email us at hello@onova.co'
              );
            }
            if (err.code == 800200 || err.code == 800180) {
              return Alert.alert('Connectivity issue', err.message);
            }
            return console.error(err);
          }

          this.setState(prevState => ({
            messages: GiftedChat.append(
              prevState.messages,
              this.createGiftedMessage(msg, userData)
            ),
          }));
        }
      );
    }
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

  createRoomAndGetMessages(otherUser: string, orderId: string) {
    const name = 'order for item X';
    this.sb.GroupChannel.createChannelWithUserIds(
      [otherUser],
      true, // isDistinct
      name,
      null, // coverUrl
      '',
      (createdChannel, err) => {
        if (err) return console.error(err);

        this.setState({ channel: createdChannel }, () => {
          console.debug('Room created', createdChannel);
          // $FlowFixMe
          this.state.channel.updateMetaData({ orderId }, (res, err) => {
            if (err) return console.error(err);
            console.log(res);
          });

          setTimeout(() => {
            if (this.state.channel) {
              // $FlowFixMe
              this.state.channel.markAsRead();
            }
          }, MARK_AS_READ_AFTER_MS);
        });
        this.setState(prevState => ({
          // $FlowFixMe
          messageQuery: prevState.channel.createPreviousMessageListQuery(),
        }));
        this.getRoomMessages(false);
      }
    );
  }

  getRoomMessages(refresh: boolean): void {
    const { messageQuery, messages, interlocutor: int } = this.state;
    const { userData } = this.props;

    // // $FlowFixMe
    // this.state.channel.getMetaData(['orderId'], (res, err) => {
    //   if (err) return console.error(err);
    //   console.log(res);
    // });

    if (refresh) {
      console.debug('refreshing messages');
      this.setState({
        // $FlowFixMe
        messageQuery: this.state.channel.createPreviousMessageListQuery(),
        messages: null,
      });
    }

    if (messageQuery) {
      if (!messageQuery.hasMore) return void console.warn('no hasMore');
      if (!int) return void console.error('no interlocutor');
      const otherUser = {
        _id: int._id,
        name: int.username,
        avatar: int.profilePic,
      };

      const reverse = true;
      messageQuery.load(50, reverse, (msgs, err) => {
        if (err) return console.error(err);

        const newMessages = msgs.map(m => {
          if (m.sender) {
            const user = m.sender.userId == userData._id ? userData : otherUser;
            return this.createGiftedMessage(m, user);
          }
          return this.createGiftedSystemMessage(m);
        });

        if (messages && messages.length) {
          return this.setState(prevState => ({
            messages: GiftedChat.append(prevState.messages, newMessages),
          }));
        }
        this.setState({
          messages: newMessages,
        });
      });
    }
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
          {!messages || isLoading ? (
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
                    onPress={() => alert('code me like those french girls 🎨')}>
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
