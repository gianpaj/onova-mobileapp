// @flow

import { Platform } from 'react-native';
import { Toast } from 'antd-mobile-rn';
import { Toast as ToastNB } from 'native-base';
import { ChatManager, TokenProvider } from '@pusher/chatkit-client/react-native';
import { Sentry } from 'react-native-sentry';
import Analytics from 'react-native-analytics-segment-io';
import { APP_NAME } from 'react-native-dotenv';

import type { PusherUser } from '@pusher/chatkit-client';
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
import { addNavigationBreadcrumb, addErrorBreadcrumb } from '../utils/analytics';

import { registerPushNotifications } from '../utils/push';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';

let currentUser: PusherUser;

const { isProd, analyticsEnabled, config } = api;

const enabledPusher = isProd == true;
// const enabledPusher = false;

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
    .then(userData => initializePusher(userData, userData.token))
    .then(userData => {
      // FIXME: use `userData` key in payload
      dispatch({ type: LOGIN_SUCCESS, payload: userData });
      addNavigationBreadcrumb({ message: LOGIN_SUCCESS });
      return registerPushNotifications()
        .then(pushToken => sendToken(pushToken, userData, userData.token))
        .catch(err => {
          console.warn(err);
          dispatch({ type: LOGIN_FAIL });
        })
        .then(() => Toast.hide());
    })
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

const PUSHER_CONN_TIMEOUT = 30 * 1000;

const initializePusher = (userData: UserData, token: string): Promise<any | Error> => {
  return new Promise((resolve, reject) => {
    if (!enabledPusher) {
      console.log('%cskipping Pusher', 'color: green');
      return resolve(userData);
    }
    console.log('initializePusher');

    const timer = setTimeout(() => {
      addErrorBreadcrumb({
        category: 'chat',
        errMsg: 'Error connecting to Chat provider',
        level: 'fatal',
      });
      reject(new Error('Error connecting to Chat provider'));
    }, PUSHER_CONN_TIMEOUT);

    const chatManager = new ChatManager({
      instanceLocator: config.PUSHER_INSTANCE,
      userId: userData._id,
      tokenProvider: new TokenProvider({
        url: config.PUSHER_TOKEN_PROVIDER,
        headers: {
          token: token,
          avatarURL: userData.profilePic,
          username: userData.username,
        },
      }),
      logger: {
        error: error =>
          addErrorBreadcrumb({
            category: 'chat',
            error,
            level: 'fatal',
          }),
        warn: error =>
          addErrorBreadcrumb({
            category: 'chat',
            error,
          }),
        info: () => {},
        debug: () => {},
        verbose: () => {},
      },
      connectionTimeout: PUSHER_CONN_TIMEOUT,
    });
    chatManager
      .connect()
      .then(user => {
        console.log('Pusher: connected');
        currentUser = user;
        clearTimeout(timer);
        resolve(userData);
        //   // TODO: Subscribe to all rooms the user is a member of
        //   user.rooms.map(room =>
        //     user.subscribeToRoom({
        //       roomId: room.id,
        //       hooks: { onNewMessage: onNewMessage },
        //       messageLimit: 1,
        //     })
        //   );
        //   const r = user.rooms.map(room => {
        //     const cursor = user.readCursor({
        //       roomId: room.id,
        //     });
        //     return { [room.id]: cursor.position };
        //   });
        //   console.log(r);
        // })
        // .then(() => {
        //   resolve(userData);
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
    .then(() => initializePusher(userData, token))
    .then(() => dispatch({ type: RELOAD_SUCCESS }))
    .then(() => registerPushNotifications())
    .then(pushToken => {
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

      // initializePusher(userData)
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
  return api
    .get(`/api/users/${userId}`)
    .then((res: UserData) => {
      addAuthBreadcrumb({ message: 'skipped' });
      dispatch({ type: SKIPPED, payload: res });
    })
    .catch(err => dispatch(handleErrorWithAlert({ type: 'SKIPPED_FAIL' }, err)))
    .finally(() => Toast.hide());
  // return dispatch({ type: SKIPPED });
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

export {
  initializePusher,
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
