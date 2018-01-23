/*global sb*/
// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  StyleSheet,
  Linking,
  Platform,
  Text,
  View,
  // $FlowFixMe
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Header,
  Icon as NBIcon,
  Left,
  Right,
  Title,
} from 'native-base';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SendBird from 'sendbird';
import { GiftedChat, Actions, Send, SystemMessage } from 'react-native-gifted-chat';
// $FlowFixMe
import type { NavigationScreenProp } from 'react-navigation';
// import moment from 'moment';
// import ImagePicker from 'react-native-image-crop-picker';
import KeyboardManager from 'react-native-keyboard-manager';

// import { ChatActions } from '../components/ChatActions';
import type { Message, UserData, ReduxState } from '../types';
import colors from '../config/colors';

if (Platform.OS == 'ios') {
  KeyboardManager.setEnable(false);
  KeyboardManager.setEnableAutoToolbar(false);
}

type Props = {
  navigation: NavigationScreenProp,
  userData: UserData,
};
type State = {
  messages: Array<Message>,
};

class OrderThreadContainer extends Component<Props, State> {
  state = {
    messages: [
      {
        _id: 1,
        text: 'Hello buyer',
        createdAt: new Date(),
        user: {
          _id: '1',
          name: 'buyer',
          avatar:
            'https://storage.googleapis.com/staging.onova-183307.appspot.com/users/5a54bbd253ee11345f32b4e2.jpg',
        },
      },
      {
        _id: 2,
        text: 'Hello seller. do you have little boots? my feet are tiny',
        createdAt: new Date(),
        user: {
          _id: '5a54bbd253ee11345f32b4e2',
          name: 'seller',
          avatar:
            'https://storage.googleapis.com/staging.onova-183307.appspot.com/users/5a54bbd253ee11345f32b4e2.jpg',
        },
      },
      {
        _id: 3,
        text: 'You are officially rocking GiftedChat.',
        createdAt: new Date(Date.UTC(2016, 7, 30, 17, 20, 0)),
        system: true,
      },
    ],
  };

  constructor(props: any) {
    super(props);
    // this.sb = new SendBird({
    //   appId: settings.APP_ID,
    // });
    // $FlowFixMe
    sb = SendBird.getInstance();
  }

  componentDidMount() {}

  componentWillMount() {
    // this.setState({
    //   messages:
    // });
  }
  componentWillUnmount() {
    SendBird.disconnect(() => console.log('SendBird disconnected'));
  }

  onSend = (messages: Message) => {
    this.setState(prevState => ({
      messages: GiftedChat.append(prevState.messages, messages),
    }));
  };

  onReceive(text: string) {
    this.setState(prevState => {
      return {
        messages: GiftedChat.append(prevState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: text,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            // avatar: 'https://facebook.github.io/react/img/logo_og.png',
          },
        }),
      };
    });
  }

  renderSystemMessage(props: any) {
    return (
      <SystemMessage
        {...props}
        containerStyle={{ margin: 15 }}
        textStyle={st.systemText}
      />
    );
  }

  joinRoom(room: string): Promise<any> {
    return new Promise((resolve, reject) => {
      SendBird.joinChannel(room, {
        successFunc: data => {
          resolve({
            joinChannelSuccessful: true,
            joinChannelResponse: data,
          });
          SendBird.connect({
            successFunc: test => {
              // console.log(test);
            },
            errorFunc: (status, error) => {
              // console.log(status, error);
            },
          });
        },
        errorFunc: (status, error) => {
          // console.log(status, error);
          reject({
            error: new Error(error),
          });
        },
      });
    });
  }

  /*
  parsePatterns(linkStyle: any) {
    return [
      @TODO: add https://github.com/joshswan/react-native-autolink
      {
        type: 'phone',
        style: linkStyle,
        onPress: (h: string) => console.warn(h, 'phone') && Linking.openURL(''),
      },
      {
        pattern: /#(\w+)/,
        style: { ...linkStyle, ...st.hashtag },
        onPress: (p: any) => Linking.caller.openURL(p),
      },
    ];
  }*/

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

  render() {
    const { navigation, userData } = this.props;
    const interlocutor = { username: 'interlocutor' };
    const { username } = this.props.userData;
    const { messages } = this.state;

    return (
      <Container style={st.flex1} keyboardShouldPersistTaps="always">
        <Header>
          <Left>
            <NBButton transparent dark onPress={() => navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body>
            <Title>@{interlocutor.username}</Title>
          </Body>
          <Right>
            <NBButton
              transparent
              // eslint-disable-next-line
              style={{ backgroundColor: 'transparent' }}
              // onPress={this.onUserPress}
            >
              <FontAwesome name="user-circle" style={st.user} size={28} />
            </NBButton>
          </Right>
        </Header>
        <View style={st.container} keyboardShouldPersistTaps="always">
          {/* <Text>d</Text> */}
          <GiftedChat
            messages={messages}
            onSend={m => this.onSend(m)}
            placeholder="Type a message"
            user={{
              _id: userData._id,
              name: userData.username,
              avatar: userData.profilePic,
            }}
            // locale=""
            // timeformat="LT"
            // dateformat="ll"
            isAnimated
            // loadEarlier
            // onLoadEarlier={() => {}}
            // isLoadingEarlier={isLoadingEarlier}
            onPressAvatar={() => alert('code me like those french girls 🎨')}
            // renderSystemMessage
            renderLoading={() => (
              <View style={st.container}>
                <ActivityIndicator size="large" />
              </View>
            )}
            renderSend={this.renderSend}
            renderSystemMessage={this.renderSystemMessage}
            // renderActions={this.renderActions}
            // renderComposer={this.renderComposer}
            // keyboardShouldPersistTaps="handled"
            maxInputLength={300}
            // renderInputToolbar={this.renderInputToolbar}
            // parsePatterns={this.parsePatterns}
            showUserAvatar
          />
        </View>
      </Container>
    );
  }
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
  },

  user: {},
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
  // hashtag: {
  //   color: colors.primary,
  // },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const OrderThread = connect(mapStateToProps)(OrderThreadContainer);
