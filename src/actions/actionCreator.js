// @flow

import { Platform } from 'react-native';
import { Toast } from 'antd-mobile-rn';
import { Toast as ToastNB } from 'native-base';
import Sendbird from 'sendbird';
import { Sentry } from 'react-native-sentry';
import Analytics from 'react-native-analytics-segment-io';
import { APP_NAME } from 'react-native-dotenv';

import {
  DO_REFRESH,
  DONOT_REFRESH,
  DO_CANCEL_ORDER,
  DONOT_CANCEL_ORDER,
  GETUSER_FAIL,
  GETUSER_PENDING,
  GETUSER_SUCCESS,
  // INTRO,
  LOGIN_FAIL,
  LOGIN_PENDING,
  LOGIN_SUCCESS,
  LOGOUT,
  RELOAD_FAIL,
  RELOAD_PENDING,
  RELOAD_SUCCESS,
  SIGNUP_FAIL,
  SIGNUP_PENDING,
  SIGNUP_SUCCESS,
  SKIPPED,
} from './actionTypes';
import type { Dispatch, LoginData, SignupData, GetState, UserData } from '../types';
import type { Options, APIError } from '../utils/api';
import { addAuthBreadcrumb, addNavigationBreadcrumb, addErrorBreadcrumb } from '../utils/analytics';

import { registerPushNotifications } from '../utils/push';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';

let currentUser: PusherUser;

const { isProd, analyticsEnabled, config } = api;

// const enabledPusher = isProd == true;
const enabledSendbird = true;

const login = (data: LoginData) => (dispatch: Dispatch) => {
  dispatch({ type: LOGIN_PENDING });
  Toast.loading('', 30);
  return api
    .post('/api/auth/login', {
      emailAddress: data.emailAddress,
      password: data.password,
    })
    .then(res => {
      if (res.data) {
        console.debug('user logged in via email');
        const userData: UserData = {
          ...res.data,
          ...{ token: res.token, provider: 'email' },
        };

        if (userData.accountStatus !== 'verified') {
          throw new Error('NOT_VERIFIED');
        }
        return userData;
      }
      console.debug(res);
      throw new Error(res);
    })
    .then(userData => {
      if (analyticsEnabled) {
        trackUser(userData);
        Analytics.track('login');
      }
      return userData;
    })
    .then(userData => initializeSendbird(userData))
    .then(userData => {
      // FIXME: use `userData` key in payload
      dispatch({ type: LOGIN_SUCCESS, payload: userData });
      addNavigationBreadcrumb({ message: LOGIN_SUCCESS });
      return registerPushNotifications()
        .then(pushToken => sendToken(pushToken, userData, userData.token))
        .catch(err => {
          console.warn(err);
          dispatch({ type: LOGIN_FAIL });
        });
    })
    .then(() => Toast.hide())
    .catch((error: APIError) => {
      Toast.hide();
      if (error.message === 'NOT_VERIFIED') {
        addErrorBreadcrumb({
          category: 'auth',
          error,
          level: 'info',
        });
        dispatch({ type: LOGIN_FAIL });
        throw error;
      }
      dispatch(handleErrorWithAlert({ type: LOGIN_FAIL }, error));
      addErrorBreadcrumb({
        category: 'auth',
        error,
        level: 'warning',
      });
    });
};

const SENDBIRD_CONN_TIMEOUT = 30 * 1000;

const initializeSendbird = (userData: UserData): Promise<any | Error> => {
  return new Promise((resolve, reject) => {
    if (!enabledSendbird) {
      console.log('%cskipping Sendbird', 'color: green');
      return resolve(userData);
    }
    console.log('initializeSendbird');

    const timer = setTimeout(() => {
      addErrorBreadcrumb({
        category: 'chat',
        errMsg: 'Error connecting to Chat provider',
        level: 'fatal',
      });
      reject(new Error('Error connecting to Chat provider'));
    }, SENDBIRD_CONN_TIMEOUT);

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
  });
};

function trackUser(userData: UserData) {
  Analytics.identify(userData._id, {
    email: userData.emailAddress,
    username: userData.username,
    accountStatus: userData.accountStatus,
  });
  Sentry.setUserContext({
    email: userData.emailAddress,
    userID: userData._id,
    username: userData.username,
    extra: {
      accountStatus: userData.accountStatus,
    },
  });
}

const checkLogin = (userData: UserData, token: string) => (dispatch: Dispatch) => {
  console.debug('checkLogin');
  dispatch({ type: RELOAD_PENDING });
  return api
    .get(`/api/users/${userData._id}/personal`, { token })
    .then(() => {
      if (analyticsEnabled) {
        trackUser(userData);
        Analytics.track('reload_login');
      }
    })
    .then(() => initializeSendbird(userData))
    .then(() => dispatch({ type: RELOAD_SUCCESS }))
    .then(() => registerPushNotifications())
    .then(pushToken => {
      if (enabledSendbird) {
        const sb = Sendbird.getInstance();
        if (sb) {
          sb.registerGCMPushTokenForCurrentUser(pushToken, (result, error) => {
            if (error) throw error;
            console.log(result);
          });
        }
      }
      sendToken(pushToken, userData, token);
      addNavigationBreadcrumb({ message: RELOAD_SUCCESS });
    })
    .catch(error => {
      dispatch({ type: RELOAD_FAIL });
      ui.showToast(error.message || JSON.stringify(error), 'danger', 'OK', 5);
      addErrorBreadcrumb({
        category: 'auth',
        error,
      });
      throw error;
    });
};

const signup = (data: SignupData) => (dispatch: Dispatch) => {
  dispatch({ type: SIGNUP_PENDING });
  const timer = setTimeout(() => {
    Toast.loading('', 30);
  }, 300);
  return api
    .post('/api/users', {
      username: data.username,
      emailAddress: data.emailAddress,
      password: data.password,
      type: APP_NAME === 'drop' ? 'reseller' : 'designer',
    })
    .then(res => {
      clearTimeout(timer);
      Toast.hide();
      if (!res.data) {
        console.warn(res);
        dispatch({ type: SIGNUP_FAIL });
        addNavigationBreadcrumb({ message: SIGNUP_FAIL });
        return;
      }
      addNavigationBreadcrumb({ message: SIGNUP_SUCCESS });
      dispatch({ type: SIGNUP_SUCCESS });
      if (analyticsEnabled) {
        trackUser(res.data);
        Analytics.track('signup');
      }

      // console.warn(userData);

      // initializeSendbird(userData)
      //   .then(() => registerPushNotifications())
      //   .then(pushToken => {
      //     if (pushToken) return sendToken(pushToken, userData);
      //   })
      //   .then(() => dispatch({ type: SIGNUP_SUCCESS, payload: userData }))
      //   .catch(err => {
      //     console.warn(err);
      //     dispatch({ type: SIGNUP_FAIL });
      //   });
      // if (analyticsEnabled) trackUser(userData)
    })
    .catch((error: APIError) => {
      clearTimeout(timer);
      Toast.hide();
      dispatch(handleErrorWithAlert({ type: SIGNUP_FAIL }, error, I18n.t('product.toast_warning_ok_button')));
      addErrorBreadcrumb({
        category: 'auth',
        error,
        level: 'warning',
      });
      throw error;
    });
};

const getPersonalUserData = (options?: Options = {}) => (dispatch: Dispatch, getState: GetState) => {
  const { token, data } = getState().LoginReducer;
  Toast.loading(I18n.t('alerts.loading_message'), 30);
  dispatch({ type: GETUSER_PENDING });
  return api
    .get(`/api/users/${data._id}/personal`, { ...options, token })
    .then((res: UserData) => dispatch({ type: GETUSER_SUCCESS, payload: res }))
    .catch(err => dispatch(handleErrorWithAlert({ type: GETUSER_FAIL }, err)))
    .then(() => Toast.hide());
};

const getUserData = (userId: string, options?: Options = {}) => (dispatch: Dispatch) => (
  Toast.loading(I18n.t('alerts.loading_message'), 30),
  dispatch({ type: GETUSER_PENDING }),
  api
    .get(`/api/users/${userId}`, options)
    .then((res: UserData) => dispatch({ type: GETUSER_SUCCESS, payload: res }))
    .catch(err => dispatch(handleErrorWithAlert({ type: GETUSER_FAIL }, err)))
    .then(() => Toast.hide())
);

const logout = () => {
  addNavigationBreadcrumb({ message: LOGOUT });
  // dispatch({ type: INTRO });

  if (currentUser) {
    currentUser.disconnect();
    console.log('disconnected from Pusher');
  }
  if (analyticsEnabled) {
    Sentry.captureBreadcrumb({
      category: 'chat',
      message: 'disconnected from Pusher',
      level: 'info',
    });
    Analytics.flush();
    Analytics.reset();
  }

  return { type: LOGOUT };
};

const skip = () => (dispatch: Dispatch) => {
  const userId = APP_NAME == 'onova' ? '5afb40d0741c953ef07a616f' : '5cd41dba3fb2da4b20f427d3';
  dispatch({ type: 'SKIP_PENDING' });
  Toast.loading('', 30);
  api
    .get(`/api/users/${userId}`)
    .then((res: UserData) => {
      addAuthBreadcrumb({ message: 'skipped' });
      dispatch({ type: SKIPPED, payload: res });
    })
    .catch(err => dispatch(handleErrorWithAlert({ type: 'SKIPPED_FAIL' }, err)))
    .finally(() => Toast.hide());
};

const sendToken = (pushToken: string, userData: UserData, token: string): Promise<any> => {
  const data = {
    platform: Platform.OS,
    pushToken,
  };

  // hack iOS01: to allow the login to continue even though the user denied permission
  if (typeof pushToken !== 'string') return Promise.resolve();
  if (__DEV__) {
    ToastNB.show({
      text: 'sendToken skipped',
      type: 'warning',
    });
    console.debug('sendToken skipped');

    return Promise.resolve();
  }

  return api
    .put(`/api/users/${userData._id}`, data, { token })
    .then(() => {
      console.debug('pushToken and platform sent');
      console.debug(data);
    })
    .catch(err => console.error(err));
};

const handleErrorWithAlert = (data: any, error: any, buttonText?) => {
  let errorType;
  if (error.status == 400 || error.status == 500) {
    errorType = 'danger';
  } else if (error.status == 401) {
    // auth error
    errorType = 'warning';

    if (error.message == 'invalid password') {
      error.message = I18n.t('alerts.password_error');
    } else if (error.message == 'invalid email') {
      error.message = I18n.t('alerts.email_error');
    }
  } else if (error.message.includes('timeout') || error.message === 'Network Error') {
    errorType = 'danger';
    error.message = I18n.t('alerts.network_error');
  } else {
    console.error(error);
  }
  addErrorBreadcrumb({
    category: 'misc',
    error,
    level: errorType == 'danger' ? 'error ' : 'warning',
  });
  if (!global.__TESTING__) {
    ui.showToast(error.message, errorType || '', buttonText);
  }
  return { type: data.type };
};

const enableRefresh = () => ({ type: DO_REFRESH });

const disableRefresh = () => ({ type: DONOT_REFRESH });

const enableCancelOrder = () => ({ type: DO_CANCEL_ORDER });

const disableCancelOrder = () => ({ type: DONOT_CANCEL_ORDER });

const sbConnect = (userId: string, nickname: string) => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject('UserID is required.');
      return;
    }
    if (!nickname) {
      reject('Nickname is required.');
      return;
    }
    const sb = new Sendbird({ appId: config.SENDBIRD_APP_ID });
    sb.connect(userId, (user, error) => {
      if (error) {
        reject('Sendbird Login Failed.');
        return;
      }
      sbUpdateProfile(nickname)
        .then(() => resolve())
        .catch(e => reject(e));
    });
  });
};

const sbUpdateProfile = nickname => {
  return new Promise((resolve, reject) => {
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
};

const registerChannelHandler = (channelUrl, dispatch) => {
  const sb = Sendbird.getInstance();
  const channelHandler = new sb.ChannelHandler();
  registerCommonHandler(channelHandler, channelUrl, dispatch);
  channelHandler.onUserJoined = (channel, user) => {
    if (channel.url === channelUrl) {
      console.log('user joined');
      console.log(user);
      // dispatch({
      //   type: CHANNEL_CHANGED,
      //   title: sbGetChannelTitle(channel),
      //   memberCount: channel.memberCount,
      // });
    }
  };
  // channelHandler.onUserLeft = (channel, user) => {
  //   if (channel.url === channelUrl) {
  //     dispatch({
  //       type: CHANNEL_CHANGED,
  //       title: sbGetChannelTitle(channel),
  //       memberCount: channel.memberCount,
  //     });
  //   }
  // };
  channelHandler.onReadReceiptUpdated = channel => {
    if (channel.url === channelUrl) {
      console.log('onReadReceiptUpdated');
      // dispatch({ type: READ_RECEIPT_UPDATED });
    }
  };
  channelHandler.onTypingStatusUpdated = channel => {
    if (channel.url === channelUrl) {
      const typing = sbIsTyping(channel);
      console.log(typing);
      // dispatch({
      //   type: TYPING_STATUS_UPDATED,
      //   typing: typing,
      // });
    }
  };
  sb.addChannelHandler(channelUrl, channelHandler);
};

const sbIsTyping = channel => {
  if (channel.isTyping()) {
    const typingMembers = channel.getTypingMembers();
    if (typingMembers.length == 1) {
      return `${typingMembers[0].nickname} is typing...`;
    }
    return 'several member are typing...';
  }
  return '';
};

const registerCommonHandler = (channelHandler: Sendbird.ChannelHandler, channelUrl, dispatch) => {
  channelHandler.onMessageReceived = (channel, message) => {
    if (channel.url === channelUrl) {
      // if (channel.isGroupChannel()) {
      // sbMarkAsRead({ channel });
      // }
      console.log(message);
      // dispatch({
      //   type: MESSAGE_RECEIVED,
      //   payload: message,
      // });
    }
  };
  // channelHandler.onMessageUpdated = (channel, message) => {
  //   if (channel.url === channelUrl) {
  //     // dispatch({
  //     //   type: MESSAGE_UPDATED,
  //     //   payload: message,
  //     // });
  //   }
  // };
  // channelHandler.onMessageDeleted = (channel, messageId) => {
  //   if (channel.url === channelUrl) {
  //     // dispatch({
  //     //   type: MESSAGE_DELETED,
  //     //   payload: messageId,
  //     // });
  //   }
  // };
};

const getPrevMessageList = (previousMessageListQuery: Sendbird.PreviousMessageListQuery) => {
  if (!previousMessageListQuery.hasMore) {
    console.log('!previousMessageListQuery.hasMore');
    // dispatch({ type: MESSAGE_LIST_FAIL });
    return Promise.resolve(true);
  }
  return sbGetMessageList(previousMessageListQuery)
    .then(messages => {
      console.log(messages);
      // dispatch({
      //   type: MESSAGE_LIST_SUCCESS,
      //   list: messages
      // });
    })
    .catch(err => console.error(err));
  // .catch(() => dispatch({ type: MESSAGE_LIST_FAIL }));
};
// const getPrevMessageList = previousMessageListQuery => dispatch => {
//   if (!previousMessageListQuery.hasMore) {
//     dispatch({ type: MESSAGE_LIST_FAIL });
//     return Promise.resolve(true);
//   }
//   return sbGetMessageList(previousMessageListQuery)
//     .then(messages => {
//       console.log(messages);
//       // dispatch({
//       //   type: MESSAGE_LIST_SUCCESS,
//       //   list: messages
//       // });
//     })
//     .catch(err => console.error(err));
//   // .catch(() => dispatch({ type: MESSAGE_LIST_FAIL }));
// };

const sbGetMessageList = (previousMessageListQuery: Sendbird.PreviousMessageListQuery) => {
  const limit = 30;
  const reverse = true;
  return new Promise((resolve, reject) => {
    previousMessageListQuery.load(limit, reverse, (messages, error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(messages);
    });
  });
};

const sbCreatePreviousMessageListQuery = (channelUrl: string): Promise<Sendbird.PreviousMessageListQuery> => {
  return new Promise((resolve, reject) => {
    sbGetGroupChannel(channelUrl)
      .then(channel => resolve(channel.createPreviousMessageListQuery()))
      .catch(error => reject(error));
  });
};

const sbGetGroupChannel = (channelUrl): Promise<Sendbird.GroupChannel> => {
  return new Promise((resolve, reject) => {
    const sb = Sendbird.getInstance();
    sb.GroupChannel.getChannel(channelUrl, (channel, error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(channel);
    });
  });
};

export {
  initializeSendbird,
  registerChannelHandler,
  getPrevMessageList,
  sbCreatePreviousMessageListQuery,
  login,
  checkLogin,
  signup,
  sendToken,
  getPersonalUserData,
  getUserData,
  logout,
  skip,
  currentUser,
  enableRefresh,
  disableRefresh,
  enableCancelOrder,
  disableCancelOrder,
};
