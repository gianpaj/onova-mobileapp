// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import type { MapStateToProps } from 'react-redux';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Body, Button as NBButton, Container, Left, Right } from 'native-base';
import Dialog from 'react-native-dialog';
import ParsedText from 'react-native-parsed-text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationActions } from 'react-navigation';
import { GiftedChat, Bubble, SystemMessage, SendProps } from 'react-native-gifted-chat';
import Sendbird from 'sendbird';

import {
  channelExit,
  getPrevMessageList,
  initChatScreen,
  sbCreatePreviousMessageListQuery,
  getChannelTitle,
  createChatHandler,
  onSendButtonPress,
  channelProgress,
  sbGetChannel,
  sbAdjustMessageList,
  sbMarkAsRead,
  getPartner,
} from '../actions/sendbird.actions';

import I18n from '../i18n';

import type { IMessage } from 'react-native-gifted-chat';
import type { NavigationScreenProp } from 'react-navigation';
import { addErrorBreadcrumb } from '../utils/analytics';
import { Header, Send, Info, Title, Icon } from '../components';
import ChatActions from '../components/ChatActions';
import MessageImage from '../components/MessageImage';

import type { SendbirdMessage } from '../types/chatReducer';
import type { Order, ReduxState, UserData } from '../types';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as linking from '../utils/linking';

const MARK_AS_READ_AFTER_MS = 300;
const ONOVA_BOT_ID = '5bd1f7af46c62e6cdee546d0';

type Props = typeof actionCreators & {
  navigation: NavigationScreenProp<{|
    params: {|
      orderId: string,
      channelUrl: string,
    |},
  |}>,
  userData: UserData,
  token: string,
  messages: Array<SendbirdMessage>,
};

type State = {
  buyerType: 'User' | 'UserWeb',
  infoDialogVisible: boolean,
  partner?: UserData,
  isLoading: boolean,
  // isTyping: boolean,
  orders: Array<Order>,
  channel?: Sendbird.GroupChannel,
  channelUrl?: string,
  shouldRefresh: boolean,
  uploadingImage: boolean,
  userDialogVisible: boolean,
};

class ChatContainer extends Component<Props, State> {
  willFocusListener;
  sb;
  previousMessageListQuery: Sendbird.PreviousMessageListQuery;
  // rejectProm;

  state = {
    buyerType: 'User',
    infoDialogVisible: false,
    isLoading: true,
    // isTyping: false,
    orders: [],
    channel: null,
    shouldRefresh: false,
    uploadingImage: false,
    userDialogVisible: false,
  };

  componentDidMount() {
    let { params }: { params: { channelUrl: string, orderId?: string } } = this.props.navigation.state;

    // refresh after leaving a review or archiving an order
    this.willFocusListener = this.props.navigation.addListener('willFocus', () => {
      const { params }: { params: { channelUrl: string } } = this.props.navigation.state;
      // do not initiate twice at the beginning
      // OR
      // when it should not refresh (a review hasn't been added or order archived)
      if (!params.channelUrl || !this.state.shouldRefresh) return;

      this.setState({ isLoading: true }, () =>
        this.initialise(params.channelUrl)
          .then(() => this.setState({ isLoading: false, shouldRefresh: false }))
          .catch(console.error)
      );
    });

    // for development on 'onova' Sendbird Instance
    if (!params) {
      // for development on 'onova' Sendbird Instance
      params = { channelUrl: 'sendbird_group_channel_203293808_b22cd74d4d812d57be87fe5936a8aa8647527a77' };
    }

    this.initialise(params.channelUrl, params.orderId)
      .then(() => this.setState({ isLoading: false }))
      .catch(err => {
        if (err) console.error(err);
      });
  }

  shouldRefresh(shouldRefresh: boolean) {
    this.setState({ shouldRefresh });
  }

  componentWillUnmount() {
    // stop receiving events from the chat room (channel URL)
    this.state.channelUrl && channelExit(this.state.channelUrl);

    // // cancel initialise(). i.e. when the Chat screen is opened and closed quickly
    // if (this.rejectProm) {
    //   this.rejectProm();
    //   this.rejectProm = null;
    // }

    this.willFocusListener.remove();
  }

  _componentInit = () => {
    const { params }: { params: { channelUrl: string, orderId?: string } } = this.props.navigation.state;
    this.props.channelProgress(false);
    this.props.getChannelTitle(params.channelUrl);
    this.props.createChatHandler(params.channelUrl);
    this._getMessageList(true);
    setTimeout(() => {
      sbMarkAsRead({ channelUrl: params.channelUrl });
    }, MARK_AS_READ_AFTER_MS);
  };

  async initialise(channelUrl: string, orderId?: string) {
    let thisRoom;
    // return new Promise((resolve, reject) => {
    // this.rejectProm = reject;
    const sb = Sendbird.getInstance();
    if (!sb) return Promise.reject('Sendbird is not initialized');
    if (!orderId && !channelUrl) return Promise.reject('either orderId or channelUrl are missing');

    this.props.initChatScreen();
    const Promises = [
      sbGetChannel(channelUrl).then(channel => {
        this.setPartner(channel, channel);
        return this.setState({ channel, channelUrl });
      }),

      this.fetchOrders(thisRoom),
      this._componentInit(),
    ];

    // coming from ChatRooms or a Push Notification
    if (!channelUrl && orderId) {
      Promises.push(api.getOrder(orderId, this.props.token));
    }
    try {
      await Promise.all(Promises);
    } catch (error) {
      addErrorBreadcrumb({
        category: 'chat',
        errMsg: `Error joining room ID: ${channelUrl}`,
      });
    }

    // else join an existing room or create one

    // // joinable rooms are those you're not a member of
    // return sendBirdCurrentUser
    //   .getJoinableRooms()
    //   .then((rooms: Array<any>) => {
    //     const allRooms = [...rooms, ...sendBirdCurrentUser.rooms];
    //     return allRooms.filter(r => r.name == getRoomName(o));
    //   })

    //     // check if there's a previously created room,
    //     // by a partner (seller) or myself

    //     let addUserIds = [o.buyer._id, userData._id];
    //     if (o.buyerType === 'UserWeb') {
    //       addUserIds = [ONOVA_BOT_ID, userData._id];
    //     }

    //     // no existing room existed
    //     return sendBirdCurrentUser
    //       .createRoom({
    //         name: getRoomName(o),
    //         addUserIds,
    //       })
  }

  _getMessageList = async (init: boolean) => {
    if (!this.previousMessageListQuery && !init) {
      return;
    }
    const { channelUrl }: { channelUrl: string } = this.props.navigation.state.params;
    if (!init) {
      this.props.getPrevMessageList(this.previousMessageListQuery);
      return;
    }

    try {
      const previousMessageListQuery = await sbCreatePreviousMessageListQuery(channelUrl);
      this.previousMessageListQuery = previousMessageListQuery;
      await this.props.getPrevMessageList(previousMessageListQuery);
    } catch (error) {
      console.error(error);
      this.props.navigation.goBack();
    }
  };

  setPartner = async (order: Order, channel?: Sendbird.GroupChannel) => {
    const { userData } = this.props;
    let partner: UserData;
    // existing channel
    if (channel) {
      const sbPartner = getPartner(channel, userData._id);
      partner = await api.getUser(sbPartner.userId);
    } else if (order.buyerType === 'UserWeb') {
      // $FlowFixMe
      partner = {
        _id: ONOVA_BOT_ID,
        username: `${order.buyer.displayName} (web)`,
      };
      this.setState({ buyerType: 'UserWeb' });
    } else {
      // creating new room (order confirmed by seller)
      partner = await api.getUser(order.buyer._id);
    }
    this.setState({ partner });
  };

  // and set partner (if UserWeb)
  fetchOrders = (thisRoom: any) => {
    const { userData, token } = this.props;
    console.debug('fetchOrders');
    return new Promise((resolve, reject) => {
      api
        .getOrders(token)
        // show orders (from confirmed to completed (incl. failed))
        // orders which are with the person I'm chatting with
        .then(orders =>
          orders
            .filter((o: Order) => getRoomName(o) == thisRoom.name)
            .filter((o: Order) => !['paid', 'cancelled', 'pending', 'reserved'].includes(o.status))
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
        .then(orders => {
          this.setState({ orders });
          if (orders.filter(o => o.buyerType == 'UserWeb').length > 0) {
            this.setState({ buyerType: 'UserWeb' });
            return api.getUserWeb(orders[0].buyer._id, this.props.token);
          }
        })
        .then(
          partner =>
            partner &&
            this.setState({
              partner: { ...partner, username: `${partner.displayName} (web)` },
            })
        )
        .then(() => resolve())
        .catch(e => reject(e));
    });
  };

  onSend = async (messages: Array<SendbirdMessage>) => {
    const { token, onSendButtonPress } = this.props;
    try {
      if (messages[0].text) {
        const { text } = messages[0];
        const { channelUrl }: { channelUrl: string } = this.props.navigation.state.params;

        onSendButtonPress(channelUrl, text);
        // if (this.props && this.props.list && this.props.list.length > 0) {
        //   this.flatList.scrollToIndex({
        //     index: 0,
        //     viewOffset: 0
        //   });
        // }
      } else {
        this.setState({ uploadingImage: true });
        // Sending Images via Pusher
        // sendBirdCurrentUser
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
        const res = await api.sendChatPhoto(
          {
            uri: messages[0].image,
            type: 'image/jpeg',
            name: 'photo.jpg',
          },
          token
        );
        // sendBirdCurrentUser
        //   .sendMessage({
        //     text: ' ', // cannot be empty string or null
        //     roomId: this.state.roomId,
        //     attachment: {
        //       type: 'image',
        //       link: res['thumb.jpeg'].path,
        //     },
        //   })
        //   .then(id => console.debug('Image message sent:', id))
        //   .catch(err => console.error(err))
        //   .then(() => {
        //     this.setState({ uploadingImage: false });
        //   });
      }
    } catch (err) {
      addErrorBreadcrumb({ category: 'chat', err });
      console.error(err);
    }
  };

  renderSystemMessage = (props): React$Element<*> => (
    <SystemMessage {...props} containerStyle={st.systemContainer} textStyle={st.systemText} />
  );

  renderSend = (props: SendProps): React$Element<*> => {
    // do allow to sellers to send messages to a buyer from the web
    const disabled = this.state.buyerType === 'UserWeb';
    const showActiveOpacity = props.text.trim().length > 0 && !disabled;
    return (
      <View style={st.send}>
        <Send {...props} disabled={disabled}>
          <Ionicons
            // eslint-disable-next-line
            style={{ opacity: showActiveOpacity ? 1 : 0.7 }}
            name="md-send"
            size={29}
          />
        </Send>
      </View>
    );
  };

  renderActions = (props: any) => {
    if (this.state.buyerType === 'UserWeb') return null;
    return <ChatActions {...props} uploadingImage={this.state.uploadingImage} />;
  };

  goToProfileOrShowWebUserInfo = () => {
    // $FlowFixMe
    const { buyerType, partner } = this.state;
    const { _id } = this.props.userData;

    if (buyerType === 'UserWeb') return this.toggleUserDialog();

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

  // only for UserWeb
  renderUserDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.userDialogVisible}
        onBackdropPress={this.toggleUserDialog}
        onBackButtonPress={this.toggleUserDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Title>{I18n.t('home.alert_info_title')}</Dialog.Title>

        <ParsedText
          style={{ marginTop: 4, margin: 18 }}
          parse={[
            {
              pattern: linking.URLpattern,
              style: st.url,
              onPress: linking.openURL,
            },
            {
              pattern: /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{2,3}[-\s\.]?[0-9]{2,3}/,
              style: st.url,
              onPress: linking.call,
            },
          ]}>
          {/* eslint-disable-next-line react-native/no-raw-text */}
          {I18n.t('chat.user_dialog.mobile_mumber') + ': ' + this.state.partner.mobileNumber}
        </ParsedText>
        <Dialog.Button label={I18n.t('product.toast_warning_ok_button')} onPress={this.toggleUserDialog} />
      </Dialog.Container>
    </React.Fragment>
  );

  renderBubble = (props: { currentMessage: IMessage }) => {
    // this prevent the <MessageText /> from rendering when an image has been sent
    if (props.currentMessage.text) props.currentMessage.text = props.currentMessage.text.trim();

    if (props.currentMessage.image) {
      // FIXME:
      return null;
    }

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

  _orderSquare = ({ item }: { item: Order }) => (
    <TouchableOpacity style={st.orderSquare} onPress={() => this.goToAddReviewOrArchiveOrder(item.id)}>
      <Image style={st.itemImage} source={{ uri: item.product.photoURIs[0]?.replace('.jpg', '-thumb.jpg') }} />
    </TouchableOpacity>
  );

  _orderKeyExtractor = (item): string => item.id;

  _orderSeparatorHorizontal = () => <View style={st.separatorHorizontal} />;

  _orderEmptyComponent = () => <Text style={st.noOrders}>{I18n.t('chat.no_orders')}</Text>;

  toggleInfoDialog = () => this.setState(prevState => ({ infoDialogVisible: !prevState.infoDialogVisible }));

  toggleUserDialog = () =>
    this.setState(prevState => ({
      userDialogVisible: !prevState.userDialogVisible,
    }));

  renderInfoDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.infoDialogVisible}
        onBackdropPress={this.toggleInfoDialog}
        onBackButtonPress={this.toggleInfoDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Title>{I18n.t('chat.alert_info_title')}</Dialog.Title>

        <Text style={{ marginTop: 4, margin: 18 }}>{I18n.t('chat.alert_info_body')}</Text>
        <Dialog.Button label={I18n.t('product.toast_warning_ok_button')} onPress={this.toggleInfoDialog} />
      </Dialog.Container>
    </React.Fragment>
  );

  renderHeader = () => (
    <Header>
      <Left style={st.containerHeader}>
        <NBButton transparent onPress={() => this.props.navigation.goBack()}>
          <Icon ios="ios-arrow-back" android="md-arrow-back" />
        </NBButton>
      </Left>
      <Body style={st.flex4AndCenter}>
        {this.state.partner && (
          <>
            <Title withIcon onPress={this.goToProfileOrShowWebUserInfo}>
              {'@' + this.state.partner.username}
            </Title>
            <Info onPress={this.toggleInfoDialog} />
          </>
        )}
      </Body>
      <Right />
    </Header>
  );

  render() {
    const { userData, messages } = this.props;
    const { buyerType, isLoading, orders } = this.state;

    if (isLoading) {
      return (
        <View style={st.container}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    const isWebUser = buyerType === 'UserWeb';

    return (
      <Container style={st.flex1}>
        {this.renderHeader()}
        <View style={st.flex1}>
          <View style={st.orderSquaresView}>
            <FlatList
              contentContainerStyle={st.orderSquaresContainer}
              data={orders}
              horizontal
              ItemSeparatorComponent={this._orderSeparatorHorizontal}
              keyExtractor={this._orderKeyExtractor}
              ListEmptyComponent={this._orderEmptyComponent}
              renderItem={this._orderSquare}
            />
          </View>
          <GiftedChat
            messages={messages}
            maxInputLength={settings.MAX_CHAT_INPUT_LENGTH}
            onSend={this.onSend}
            // onInputTextChanged
            /* Custom footer component on the ListView, e.g. 'User is typing...' */
            // renderFooter
            placeholder={isWebUser ? I18n.t('chat.send_msg_placeholder_disabled') : I18n.t('chat.send_msg_placeholder')}
            // renderActions={this.renderActions}
            renderBubble={this.renderBubble}
            // TODO:
            // renderMessageImage={MessageImage}
            renderSend={this.renderSend}
            renderSystemMessage={this.renderSystemMessage}
            user={{
              _id: userData._id,
              name: userData.username,
              avatar: userData.profilePic,
            }}
            textInputProps={{ editable: !isWebUser }}
            // TODO: hide if have loaded all the messages
            loadEarlier
            infiniteScroll
            // onEndReachedThreshold={0}
            onLoadEarlier={() => this._getMessageList(false)}
          />
        </View>
        {this.renderInfoDialog()}
        {isWebUser && this.renderUserDialog()}
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
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  containerHeader: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  flex4AndCenter: {
    alignItems: 'center',
    flex: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  itemImage: {
    height: 50,
    width: 50,
  },
  noOrders: {
    alignSelf: 'center',
    color: colors.grey3,
    flex: 1,
    textAlign: 'center',
  },
  orderSquare: {
    borderBottomWidth: 2,
    borderColor: colors.active,
    marginBottom: 3,
    paddingLeft: 8,
  },
  orderSquaresContainer: { flexGrow: 1 },
  orderSquaresView: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey5,
    height: 50 + 16 + 1,
    paddingVertical: 4,
  },
  send: {
    marginBottom: 10,
    marginRight: 10,
  },
  separatorHorizontal: {
    width: 1,
  },
  systemContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.active,
    borderRadius: 5,
    marginHorizontal: 65,
    marginVertical: 15,
    padding: 5,
  },
  systemText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  url: {
    color: colors.active,
    textDecorationLine: 'underline',
  },
});

const mapStateToProps: MapStateToProps<*> = ({ LoginReducer, ChatReducer }: ReduxState) => ({
  userData: LoginReducer.data,
  token: LoginReducer.token,
  messages: sbAdjustMessageList(ChatReducer.list),
});

const actionCreators = {
  initChatScreen,
  getPrevMessageList,
  channelProgress,
  getChannelTitle,
  createChatHandler,
  onSendButtonPress,
};

export const Chat = connect(
  mapStateToProps,
  actionCreators
)(ChatContainer);
