// @flow
import Sendbird from 'sendbird';

import type { SendbirdMessage, Action } from '../types/chatReducer';
import type { Dispatch, UserData } from '../types';
import type { IMessage } from 'react-native-gifted-chat';

import * as ACTION_TYPES from './actionTypes';
import { config } from '../utils/api';
import { addErrorBreadcrumb } from '../utils/analytics';

import { enabledSendbird } from './actionCreator';

const CONN_TIMEOUT = 30 * 1000;
const LIMIT = 30;

export const channelExit = (channelUrl: string) => (dispatch: Dispatch): Promise<boolean> => {
  const sb = Sendbird.getInstance();
  sb.removeChannelHandler(channelUrl);
  dispatch({ type: ACTION_TYPES.CHANNEL_EXIT_SUCCESS });
  return Promise.resolve(true);
};

export const initChatScreen = (): Action => {
  const sb = Sendbird.getInstance();
  sb.removeAllChannelHandlers();
  return { type: ACTION_TYPES.INIT_CHAT_SCREEN };
};

export const sbCreatePreviousMessageListQuery = (channelUrl: string): Promise<Sendbird.PreviousMessageListQuery> =>
  new Promise((resolve, reject) => {
    sbGetChannel(channelUrl)
      .then(channel => resolve(channel.createPreviousMessageListQuery()))
      .catch(error => reject(error));
  });

export const getPrevMessageList = (previousMessageListQuery: Sendbird.PreviousMessageListQuery) => (
  dispatch: Dispatch
) => {
  if (!previousMessageListQuery.hasMore) {
    console.log('!previousMessageListQuery.hasMore');
    dispatch({ type: ACTION_TYPES.MESSAGE_LIST_FAIL });
    return Promise.resolve(true);
  }
  return (
    sbGetMessageList(previousMessageListQuery)
      .then(messages => {
        console.log(messages);
        dispatch({
          type: ACTION_TYPES.MESSAGE_LIST_SUCCESS,
          list: messages,
        });
      })
      // .catch(err => console.error(err));
      .catch(() => dispatch({ type: ACTION_TYPES.MESSAGE_LIST_FAIL }))
  );
};

const sbGetMessageList = (
  previousMessageListQuery: Sendbird.PreviousMessageListQuery
): Promise<Array<SendbirdMessage> | Sendbird.SendBirdError> =>
  new Promise((resolve, reject) => {
    const reverse = true;
    previousMessageListQuery.load(LIMIT, reverse, (messages, error) => {
      if (error) return reject(error);

      resolve(messages.filter(m => m.messageType !== 'admin'));
    });
  });

const registerCommonHandler = (channelHandler: Sendbird.ChannelHandler, channelUrl: string, dispatch: Dispatch) => {
  channelHandler.onMessageReceived = (channel: Sendbird.GroupChannel, message: SendbirdMessage) => {
    if (channel.url === channelUrl) {
      sbMarkAsRead({ channel });
      console.log(message);
      dispatch({
        type: ACTION_TYPES.MESSAGE_RECEIVED,
        payload: message,
      });
    }
  };
  // channelHandler.onMessageUpdated = (channel, message) => {
  //   if (channel.url === channelUrl) {
  //     dispatch({
  //       type: ACTION_TYPES.MESSAGE_UPDATED,
  //       payload: message,
  //     });
  //   }
  // };
  channelHandler.onMessageDeleted = (channel: Sendbird.GroupChannel, messageId: string) => {
    if (channel.url === channelUrl) {
      dispatch({
        type: ACTION_TYPES.MESSAGE_DELETED,
        payload: messageId,
      });
    }
  };
};

const sbIsTyping = (channel: Sendbird.GroupChannel): string => {
  if (channel.isTyping()) {
    const typingMembers = channel.getTypingMembers();
    if (typingMembers.length == 1) {
      return `${typingMembers[0].nickname} is typing...`;
    }
    return 'several member are typing...';
  }
  return '';
};

export const registerChannelHandler = (channelUrl: string, dispatch: Dispatch) => {
  const sb = Sendbird.getInstance();
  const channelHandler = new sb.ChannelHandler();
  channelHandler.onUserJoined = (channel, user) => {
    if (channel.url === channelUrl) {
      console.log('user joined');
      console.log(user);
      dispatch({
        type: ACTION_TYPES.CHANNEL_CHANGED,
        title: getChannelTitle(channel),
        memberCount: channel.memberCount,
      });
    }
  };
  // channelHandler.onUserLeft = (channel: Sendbird.GroupChannel): void => {
  //   if (channel.url === channelUrl) {
  //     dispatch({
  //       type: ACTION_TYPES.CHANNEL_CHANGED,
  //       // title: getChannelTitle(channel),
  //       // memberCount: channel.memberCount,
  //     });
  //   }
  // };
  channelHandler.onReadReceiptUpdated = (channel: Sendbird.GroupChannel) => {
    if (channel.url === channelUrl) {
      console.log('onReadReceiptUpdated');
      dispatch({ type: ACTION_TYPES.READ_RECEIPT_UPDATED });
    }
  };
  channelHandler.onTypingStatusUpdated = (channel: Sendbird.GroupChannel) => {
    if (channel.url === channelUrl) {
      const typing = sbIsTyping(channel);
      console.log(typing);
      dispatch({
        type: ACTION_TYPES.TYPING_STATUS_UPDATED,
        typing: typing,
      });
    }
  };
  registerCommonHandler(channelHandler, channelUrl, dispatch);
  sb.addChannelHandler(channelUrl, channelHandler);
};

export const initializeSendbird = (userData: UserData): Promise<any | Error> =>
  new Promise((resolve, reject) => {
    if (!enabledSendbird) {
      console.log('%cskipping Sendbird', 'color: green');
      return resolve(userData);
    }
    console.log('initializeSendbird');

    const timer = setTimeout(() => {
      addErrorBreadcrumb({
        category: 'chat',
        errMsg: 'Error connecting to Sendbird',
        level: 'fatal',
      });
      reject(new Error('Error connecting to Sendbird'));
    }, CONN_TIMEOUT);

    // const sb = Sendbird.getInstance();

    // if (!sb) return reject('Sendbird is not initialized');

    sbConnect(userData._id, userData.displayName)
      .then(() => {
        console.log('Sendbird: connected');
        clearTimeout(timer);
        resolve(userData);
      })
      .catch(error => {
        addErrorBreadcrumb({
          category: 'chat',
          error,
          level: 'fatal',
        });
        clearTimeout(timer);
        reject(error);
      });

    // const chatManager = new ChatManager({
    //   tokenProvider: new TokenProvider({
    //     headers: {
    //       avatarURL: userData.profilePic,
    //       username: userData.username,
    //     },
    //   }),
    // });
    // TODO: Subscribe to all rooms the user is a member of
  });

const sbConnect = (userId: string, nickname: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!userId) {
      return reject('UserID is required.');
    }
    if (!nickname) {
      return reject('Nickname is required.');
    }
    const sb = new Sendbird({ appId: config.SENDBIRD_APP_ID });
    sb.connect(userId, (user, error) => {
      if (error) {
        return reject('Sendbird Login Failed.');
      }
      sbUpdateProfile(nickname)
        .then(() => resolve())
        .catch(e => reject(e));
    });
  });

const sbUpdateProfile = nickname =>
  new Promise((resolve, reject) => {
    if (!nickname) {
      reject('Nickname is required.');
      return;
    }
    const sb = Sendbird.getInstance();
    let profileUrl = '';
    sb.updateCurrentUserInfo(nickname, profileUrl, (user, error) => {
      if (error) {
        console.warn('Update profile failed.');
        reject(error);
        return;
      }
      resolve();
    });
  });

export const initGroupChannel = () => {
  const sb = Sendbird.getInstance();
  sb.removeAllChannelHandlers();
  return { type: ACTION_TYPES.INIT_CHANNEL };
};

export const channelProgress = (start: boolean) => {
  return {
    type: start ? ACTION_TYPES.CHANNEL_PROGRESS_START : ACTION_TYPES.CHANNEL_PROGRESS_END,
  };
};

export const getChannelList = channelListQuery => (dispatch: Dispatch) => {
  if (channelListQuery && channelListQuery.hasNext) {
    return sbGetChannelList(channelListQuery)
      .then(channels =>
        dispatch({
          type: ACTION_TYPES.CHANNEL_LIST_SUCCESS,
          list: channels,
        })
      )
      .catch(() => dispatch({ type: ACTION_TYPES.CHANNEL_LIST_FAIL }));
  }
  dispatch({ type: ACTION_TYPES.CHANNEL_LIST_FAIL });
  return Promise.resolve();
};

export const onChannelPress = (channelUrl: string) => (dispatch: Dispatch) => {
  return sbGetChannel(channelUrl)
    .then(channel =>
      dispatch({
        type: ACTION_TYPES.GET_CHANNEL_SUCCESS,
        channel: channel,
      })
    )
    .catch(() => dispatch({ type: ACTION_TYPES.GET_CHANNEL_FAIL }));
};

export const addChannelItem = (channel: Sendbird.Channel) => {
  return {
    type: ACTION_TYPES.ADD_CHANNEL_ITEM,
    channel: channel,
  };
};

export const clearSelectedChannel = () => {
  return { type: ACTION_TYPES.CLEAR_SELECTED_CHANNEL };
};

export const createChannelListHandler = () => (dispatch: Dispatch) => {
  const sb = Sendbird.getInstance();
  const channelHandler = new sb.ChannelHandler();
  channelHandler.onChannelChanged = (channel: Sendbird.Channel) => {
    dispatch({
      type: ACTION_TYPES.CHANNEL_CHANGED,
      channel,
    });
  };
  sb.addChannelHandler('CHANNEL_LIST_HANDLER', channelHandler);
};

/**
 * channels
 */

export const createChatHandler = (channelUrl: string) => (dispatch: Dispatch) =>
  sbGetChannel(channelUrl)
    .then(() => registerChannelHandler(channelUrl, dispatch))
    .then(() => dispatch({ type: ACTION_TYPES.CREATE_CHAT_HANDLER_SUCCESS }))
    .catch(() => dispatch({ type: ACTION_TYPES.CREATE_CHAT_HANDLER_FAIL }));

export const sbCreateChannelListQuery = () => {
  const sb = Sendbird.getInstance();
  return sb.GroupChannel.createMyGroupChannelListQuery();
};

export const sbGetChannelList = (channelListQuery): Promise<any> =>
  new Promise((resolve, reject) => {
    channelListQuery.next((channels, error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(channels);
    });
  });

export const sbGetChannel = (channelUrl: string): Promise<Sendbird.GroupChannel> =>
  new Promise((resolve, reject) => {
    const sb = Sendbird.getInstance();
    sb.GroupChannel.getChannel(channelUrl, (channel, error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(channel);
    });
  });

export const sbHideGroupChannel = (channelUrl: string): Promise<any> =>
  new Promise((resolve, reject) => {
    sbGetChannel(channelUrl)
      .then(channel => {
        channel.hide((response, error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response);
        });
      })
      .catch(error => reject(error));
  });

export const sbCreateUserListQuery = () => {
  const sb = Sendbird.getInstance();
  return sb.createApplicationUserListQuery();
};

// export const sbGetUserList = (userListQuery): Promise<any> =>
//  new Promise((resolve, reject) => {
//     userListQuery.next((users, error) => {
//       if (error) {
//         reject(error);
//         return
//       }
//         resolve(users);
//     });
//   });

export const sbCreateChannel = (inviteUserIdList: string[], isDistinct: boolean): Promise<Sendbird.GroupChannel> =>
  new Promise((resolve, reject) => {
    const sb = Sendbird.getInstance();
    // eslint-disable-next-line sonarjs/no-identical-functions
    sb.GroupChannel.createChannelWithUserIds(inviteUserIdList, isDistinct, (channel, error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(channel);
    });
  });

// export const sbInviteChannel = (inviteUserIdList, channelUrl) => {
//   return new Promise((resolve, reject) => {
//     sbGetChannel(channelUrl)
//       .then(channel => {
//         channel.inviteWithUserIds(inviteUserIdList, (channel, error) => {
//           if (error) {
//             reject(error);
//           } else {
//             resolve(channel);
//           }
//         });
//       })
//       .catch(error => {
//         reject(error);
//       });
//   });
// };

export const sbGetChannelTitle = (channel: Sendbird.GroupChannel) => {
  let nicknames = channel.members.map(member => member.nickname).join(', ');

  if (nicknames.length > 21) {
    nicknames = nicknames.substring(0, 17) + '...';
  }

  return nicknames;
};

export const getChannelTitle = (channelUrl: string) => (dispatch: Dispatch) =>
  sbGetChannel(channelUrl)
    .then(channel => {
      dispatch({
        type: ACTION_TYPES.CHANNEL_CHANGED,
        title: sbGetChannelTitle(channel),
        memberCount: channel.memberCount,
      });
    })
    .catch(() => dispatch({ type: ACTION_TYPES.CHANNEL_CHANGED_FAIL }));

export const sbAdjustMessageList = (list: Array<SendbirdMessage>) =>
  // $FlowFixMe
  list.map((message, i) => {
    message['time'] = sbUnixTimestampToDate(message.createdAt);
    message.readCount = 0;
    if (message.isUserMessage() || message.isFileMessage()) {
      message.isUser = message.sender.userId === Sendbird.getInstance().getCurrentUserId();
    } else {
      message.isUser = false;
    }
    if (message.sender) {
      message.sender.isShow = true;
      if (!message.sender.profileUrl) {
        message.sender.profileUrl = 'default-image';
      }
    }

    if (i < list.length - 1) {
      const prevMessage = list[i + 1];
      if (
        (message.isUserMessage() || message.isFileMessage()) &&
        (prevMessage.isUserMessage() || prevMessage.isFileMessage()) &&
        prevMessage.sender.userId === message.sender.userId
      ) {
        message.sender.isShow = false;
      }
    }
    return createGiftedMessage(message);
  });

const createGiftedMessage = (msg: SendbirdMessage): IMessage => ({
  ...msg,
  _id: msg.messageId,
  text: msg.message,
  user: {
    _id: msg.sender.userId,
    name: msg.sender.username,
    avatar: msg.sender.profileUrl,
  },
  image: Boolean(msg.messageType == 'file'),
  // system: Boolean(msg.messageType == 'admin'),
});

export const sbUnixTimestampToDate = (unixTimestamp: number) => {
  const today = new Date();
  const date = new Date(unixTimestamp);

  if (today.getMonth() !== date.getMonth() || today.getDay() !== date.getDay()) {
    return date.getMonth() + '/' + date.getDay();
  }
  const hour = '0' + date.getHours();
  const minute = '0' + date.getMinutes();
  return hour.substr(-2) + ':' + minute.substr(-2);
};

const ONOVA_BOT_ID = '5bd1f7af46c62e6cdee546d0';

// export const createGiftedMessage = (msg: SendbirdMessage): SendbirdMessage => {
//   // const { userData } = this.props;
//   if (msg.senderId === ONOVA_BOT_ID) {
//     return createGiftedSystemMessage(msg);
//   }
//   // const otherUser = getPartner();
//   // const user = msg.senderId == userData._id ? userData : otherUser;
//   const message = {
//     _id: msg.id,
//     createdAt: new Date(msg.createdAt),
//     text: msg.text,
//     // user: {
//     //   _id: user._id,
//     //   name: user.username || user.name,
//     //   avatar: user.avatar || user.profilePic,
//     // },
//     sent: msg.sent ? msg.sent : false,
//     received: msg.received ? msg.received : false,
//   };

//   if (msg.attachment) {
//     return {
//       ...message,
//       image: msg.attachment,
//     };
//   }
//   return message;
// };

// const getPartner = (): { _id: string, name: string, avatar: string } => {
//   const { partner }: { partner: UserData | any } = this.state;
//   return {
//     _id: partner._id,
//     name: partner.username,
//     avatar: partner.profilePic,
//   };
// };

export const createGiftedSystemMessage = (msg: SendbirdMessage) => {
  return {
    _id: msg.id,
    createdAt: new Date(msg.createdAt),
    text: msg.text,
    system: true,
  };
};

export const onSendButtonPress = (channelUrl: string, text: string) => (dispatch: Dispatch) =>
  sbGetChannel(channelUrl)
    .then(channel => sbSendTextMessage(channel, text))
    .then(message =>
      dispatch({
        type: ACTION_TYPES.SEND_MESSAGE_SUCCESS,
        message,
      })
    )
    .catch(() => dispatch({ type: ACTION_TYPES.SEND_MESSAGE_FAIL }));

export const sbSendTextMessage = (channel: Sendbird.GroupChannel, text: string): Promise<string> =>
  new Promise((resolve, reject) => {
    if (channel.isGroupChannel()) {
      channel.endTyping();
    }
    channel.sendUserMessage(text, (message, error) => {
      if (error) return reject(error);
      resolve(message);
    });
  });

export const sbMarkAsRead = ({
  channelUrl,
  channel,
}: {
  channelUrl?: string,
  channel?: Sendbird.GroupChannel,
}): void => {
  if (channel) {
    channel.markAsRead();
    return;
  }
  if (channelUrl) {
    sbGetChannel(channelUrl).then(channel => channel.markAsRead());
  }
};

export const getPartner = (channel: Sendbird.GroupChannel, myUserId: string): Sendbird.User =>
  channel.members.filter(m => m.userId !== ONOVA_BOT_ID).find(m => m.userId !== myUserId);
