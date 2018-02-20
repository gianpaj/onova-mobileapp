// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

// prettier-ignore
import {
  ActivityIndicator,
  Alert,
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
import SendBird from 'sendbird';
import { GiftedChat, SystemMessage } from 'react-native-gifted-chat';
import type { NavigationScreenProp } from 'react-navigation';
// import moment from 'moment';
import KeyboardManager from 'react-native-keyboard-manager';

// import { sbCreateOpenChannelListQuery } from '../actions/sendbird';
import Send from '../components/Send';
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

if (Platform.OS == 'ios') {
  KeyboardManager.setEnable(false);

  // ? Fixed problem with setEnableAutoToolbar:false https://github.com/douglasjunior/react-native-keyboard-manager/commit/e43ee9a9b75711235bc06e70be5a47f8c560944b
  KeyboardManager.setEnableAutoToolbar(false);
}

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
  product: Product | {},
  product: Order | {},
};

const tempMessages = [
  {
    _id: 3,
    text: 'You are officially rocking GiftedChat.',
    createdAt: new Date(Date.UTC(2016, 7, 30, 17, 20, 0)),
    system: true,
  },
];

class OrderThreadContainer extends Component<Props, State> {
  sb;

  state = {
    channel: null,
    hasRendered: false,
    isLoading: false,
    isTyping: false,
    messageQuery: null,
    messages: null,
    interlocutor: null,
    product: {},
    order: {},
  };

  _getInterlucutorUserData(userId: string): Promise<null | any> {
    return new Promise((resolve, reject) => {
      api
        .get(`/api/users/${userId}`)
        .then(res => {
          console.debug(res);
          this.setState({ interlocutor: res });
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
        .then(res => {
          const data = res.data;
          console.debug(res.data);
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
        .then(res => {
          const data = res.data;
          console.debug(res.data);
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

  componentWillMount() {
    const { params } = this.props.navigation.state;

    console.log(params);

    let userId = '';
    let orderId = '';
    let productId = '';
    // for development
    if (!params) {
      orderId = '5aaa54475331ae236613f2ad';
      // productId = '';

      this.getTempUserId('firstperson').then(userId => {
        this.initialise(userId, orderId, productId);
      });
    } else if (params && params.item.seller) {
      // coming from Checkout or OrdersList
      // @TODO: check show is the seller/buyer!
      userId = params.item.seller._id;
      orderId = params.order.id;
      productId = params.item.uuid;
      this.initialise(userId, orderId, productId);
    }
  }

  initialise(userId: string, orderId: string, productId: string) {
    const Promises = [];
    Promises.push(this._getInterlucutorUserData(userId));
    Promises.push(this.fetchProduct(productId));
    Promises.push(this.fetchOrder(orderId));
    Promises.push(this.connectToSendBird(orderId));

    Promise.all(Promises)
      .then(() => {
        this.setState({ hasRendered: true, isLoading: false });
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
      // @TODO: remove this if don't get a warning when quickly opening a chat thread.
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
        avatar: int.profilePic == null ? int.profilePic : null,
      };

      const giftedMsg = this.createGiftedMessage(msg, user);

      this.setState(prevState => ({
        messages: GiftedChat.append(prevState.messages, giftedMsg),
      }));
    };

    // ChannelHandler.onTypingStatusUpdated = channel => {
    //   console.log(channel);
    // };
    return ChannelHandler;
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
    this.sb.disconnect(() => console.debug('SendBird disconnected'));
    this.sb.removeChannelHandler('ChatView');
    this.sb.removeConnectionHandler('ChatView');
  }

  onSend = (messages: Array<Message>) => {
    const { userData } = this.props;

    if (this.state.channel) {
      const text = messages[0].text;
      this.state.channel.sendUserMessage(
        text,
        '',
        (msg: SendBirdMessage, err) => {
          if (err) {
            // profanity filter
            if (err.code == 900060) {
              return Alert.alert(
                'Message blocked by profanity filter',
                'If you think this is an error please email us at hello@onova.co'
              );
            }
            return console.error(err);
          }

          // const mymsg = {
          //   _id: msg.messageId,
          //   createdAt: new Date(msg.createdAt),
          //   text: msg.message,
          //   user: {
          //     _id: userData._id,
          //     name: userData.username,
          //     // or msg.sender.profileUrl ?
          //     avatar: userData.profilePic,
          //   },
          // };

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
        });
        this.setState(prevState => ({
          // $FlowFixMe
          messageQuery: prevState.channel.createPreviousMessageListQuery(),
        }));
        this.getRoomMessages(false);
      }
    );
  }

  getRoomMessages(refresh: boolean) {
    const { messageQuery, messages, interlocutor } = this.state;
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
      if (!messageQuery.hasMore) {
        console.warn('no hasMore');
        return;
      }

      const reverse = true;
      messageQuery.load(50, reverse, (msgs, err) => {
        if (err) return console.error(err);
        if (!interlocutor) return console.error('no interlocutor');

        const otherUser = {
          _id: interlocutor._id,
          name: interlocutor.username,
        };

        const newMessages = msgs.map(m => {
          const user = m.sender.userId == userData._id ? userData : otherUser;
          return this.createGiftedMessage(m, user);
        });

        if (messages && messages.length) {
          // const newMessageList = [...messages, newMessages];
          this.setState(prevState => ({
            messages: GiftedChat.append(prevState.messages, newMessages),
          }));
        } else {
          this.setState({
            // lastMessage: lastNewMsg,
            messages: newMessages,
          });
        }
        // const lastNewMsg = messages[messages.length - 1];
        // this.setState({
        //   messages: newMessageList,
        // });
      });
    }
  }

  /*
  renderComposer(props: any) {
    return (
      <Composer
        {...props}
        textInputProps={{
          returnKeyType: 'send',
          multiline: false,
          onSubmitEditing: event => {
            props.onSend({ text: event.nativeEvent.text.trim() }, true);
          },
        }}
      />
    );
  }*/

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
    } else {
      return true;
    }
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

  render() {
    const { navigation, userData } = this.props;
    const { messages, isLoading, interlocutor, product, order } = this.state;

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
              // eslint-disable-next-line
              style={{ backgroundColor: 'transparent' }}
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
                <Text numberOfLines={1} style={{ width: '50%', top: -1.5 }}>
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
                  // avatar:
                  //   userData.profilePic !== null ? userData.profilePic : null,
                }}
                // locale=""
                // timeformat="LT"
                // dateformat="ll"
                // onPressAvatar={() => alert('code me like those french girls 🎨')}
                // renderLoading={() => ()}
                renderSend={this.renderSend}
                renderSystemMessage={this.renderSystemMessage}
                // renderActions={this.renderActions}
                // renderComposer={this.renderComposer}
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
    borderRadius: 25,
    borderColor: colors.active,
    marginVertical: 15,
    marginHorizontal: 105,
    paddingVertical: 5,
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

export const OrderThread = connect(mapStateToProps)(OrderThreadContainer);
