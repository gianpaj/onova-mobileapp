// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  StyleSheet,
  Linking,
  Platform,
  View,
  Text,
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
import {
  GiftedChat,
  // Actions,
  Send,
  SystemMessage,
} from 'react-native-gifted-chat';
import type { NavigationScreenProp } from 'react-navigation';
// import moment from 'moment';
// import ImagePicker from 'react-native-image-crop-picker';
import KeyboardManager from 'react-native-keyboard-manager';

// import { sbCreateOpenChannelListQuery } from '../actions/sendbird';
// import { ChatActions } from '../components/ChatActions';
import type {
  Message,
  Product,
  SendBirdMessage,
  UserData,
  ReduxState,
} from '../types';
import colors from '../config/colors';
import { call, email } from '../utils/linking';
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
  navigation: NavigationScreenProp<any>,
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
  product: Product | null,
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
  sb: any;

  state = {
    channel: null,
    hasRendered: false,
    isLoading: false,
    isTyping: false,
    messageQuery: null,
    messages: null,
    interlocutor: null,
    product: null,
  };

  _getInterlucutorUserData(userId: string): Promise<any> {
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

  _getProduct(uuid: string): Promise<any> {
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

  componentWillMount() {
    const { params } = this.props.navigation.state;

    const Promises = [];
    console.log(params);

    let userId = '';
    if (!params) {
      // @TODO: for test
      // firstperson
      userId = '5a69d21de270b4d9b481f69c';
    }
    // coming from Product
    if (params && params.seller) {
      userId = params.seller._id;
    }

    // coming from OrdersList
    // if (params && params.seller) {
    //   userId = params.seller._id;
    // }

    Promises.push(this._getInterlucutorUserData(userId));
    // Promises.push(this._getProduct(params.uuid));
    Promises.push(this.connectToSendBird());

    Promise.all(Promises)
      .then(() => {
        this.setState({ hasRendered: true, isLoading: false });
      })
      .catch(err => console.error(err));
  }

  connectToSendBird(): Promise<any> {
    return new Promise((resolve, reject) => {
      // @TODO: remove this if don't get a warning when quickly opening a chat thread.
      // Maybe from a deeplink, opening app from background?
      setTimeout(() => {
        this.sb = SendBird.getInstance();
        if (!this.state.hasRendered) {
          this.sb.connect(this.props.userData._id, (user, err) => {
            if (err) return reject(err);

            console.debug(user);

            this.createRoomAndGetMessages(this.state.interlocutor._id);

            this.sb.addChannelHandler('ChatView', this.createChannelHandler());

            const ConnectionHandler = new this.sb.ConnectionHandler();
            ConnectionHandler.onReconnectSucceeded = () => {
              this.getRoomMessages(true);
              // $FlowFixMe
              this.state.channel.refresh();
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

    ChannelHandler.onTypingStatusUpdated = channel => {
      console.log(channel);
    };
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
    const { userData: ud } = this.props;

    if (this.state.channel) {
      const text = messages[0].text;
      this.state.channel.sendUserMessage(
        text,
        '',
        (msg: SendBirdMessage, err) => {
          if (err) return console.error(err);

          const mymsg = {
            _id: msg.messageId,
            createdAt: new Date(msg.createdAt),
            text: msg.message,
            user: {
              _id: ud._id,
              name: ud.username,
              // or msg.sender.profileUrl ?
              avatar: ud.profilePic,
            },
          };

          this.setState(prevState => ({
            messages: GiftedChat.append(
              prevState.messages,
              this.createGiftedMessage(msg, ud)
            ),
          }));
        }
      );
    }
  };

  renderSystemMessage(props: any) {
    return (
      <SystemMessage
        {...props}
        containerStyle={{ margin: 15 }}
        textStyle={st.systemText}
      />
    );
  }

  createRoomAndGetMessages(otherUser: string) {
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
        console.warn('no messageQuery OR no hasMore');
        return;
      }

      const reverse = false;
      messageQuery.load(20, reverse, (msgs, err) => {
        if (err || !interlocutor) return console.error(err);
        if (!interlocutor) return console.error('no interlocutor');

        const otherUser = {
          _id: interlocutor._id,
          name: interlocutor.username,
        };

        const newMessages = [];
        for (let i = 0; i < msgs.length; i++) {
          const user =
            msgs[i].sender.userId == userData._id ? userData : otherUser;
          newMessages.push(this.createGiftedMessage(msgs[i], user));
        }

        if (messages && messages.length) {
          const newMessageList = [...messages, newMessages];
          this.setState(prevState => ({
            // lastMessage: lastNewMsg,
            messages: GiftedChat.append(prevState.messages, newMessageList),
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

  parsePatterns = (linkStyle: any) => {
    return [
      {
        type: 'phone',
        style: linkStyle,
        onPress: (p: string) => call(p),
      },
      {
        pattern: /#(\w+)/,
        style: { ...linkStyle, ...st.hashtag },
        onPress: (p: any) => Linking.caller.openURL(p),
      },
    ];
  };

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

  renderSend(props: any) {
    return (
      <Send {...props}>
        <View style={st.send}>
          <Ionicons name="md-send" size={29} />
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
    const user = this.props.navigation.state.params.seller;

    const navigateToProfile = NavigationActions.navigate({
      routeName: 'profile',
      params: user,
    });

    this.props.navigation.dispatch(navigateToProfile);
  };

  render() {
    const { navigation, userData } = this.props;
    const { messages, isLoading, interlocutor } = this.state;

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
            <GiftedChat
              messages={messages}
              onSend={m => this.onSend(m)}
              placeholder="Type a message"
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
              onPressAvatar={() => alert('code me like those french girls 🎨')}
              // renderLoading={() => ()}
              renderSend={this.renderSend}
              renderSystemMessage={this.renderSystemMessage}
              // renderActions={this.renderActions}
              // renderComposer={this.renderComposer}
              // keyboardShouldPersistTaps="handled"
              maxInputLength={300}
              // renderInputToolbar={this.renderInputToolbar}
              parsePatterns={this.parsePatterns}
              showUserAvatar
            />
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
  send: {
    marginBottom: 5,
    marginRight: 10,
  },
  systemText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '400',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const OrderThread = connect(mapStateToProps)(OrderThreadContainer);
