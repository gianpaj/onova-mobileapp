// @flow

import { Platform } from 'react-native';
import { Toast } from 'antd-mobile-rn';
import { ChatManager, TokenProvider } from '@pusher/chatkit/react-native';
import { Sentry } from 'react-native-sentry';
import Analytics from 'react-native-analytics-segment-io';

import type { PusherUser } from '@pusher/chatkit';
import {
  LOGIN_PENDING,
  LOGIN_FAIL,
  LOGIN_SUCCESS,
  SIGNUP_PENDING,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  LOGOUT,
  GETUSER_PENDING,
  GETUSER_SUCCESS,
  GETUSER_FAIL,
  DO_REFRESH,
  DONOT_REFRESH,
  RELOAD_FAIL,
  RELOAD_SUCCESS,
} from './actionTypes';
import type {
  Dispatch,
  LoginData,
  SignupData,
  GetState,
  UserData,
  // PusherUser,
} from '../types';
import type { Options, APIError } from '../utils/api';

import { registerPushNotifications } from '../utils/push';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';

let currentUser: PusherUser;

const { isProd, analyticsEnabled, config } = api;

const intro = () => (dispatch: Dispatch) => {
  dispatch(logout());
  dispatch({ type: 'INTRO' });
};

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
      return registerPushNotifications()
        .then(pushToken => {
          if (pushToken) return sendToken(pushToken, userData, userData.token);
        })
        .catch(err => {
          console.warn(err);
          dispatch({ type: LOGIN_FAIL });
        })
        .then(() => Toast.hide());
    })
    .catch((err: APIError) => {
      Toast.hide();
      if (err.message === 'NOT_VERIFIED') {
        dispatch({ type: LOGIN_FAIL });
        throw err;
      }
      console.debug(err);
      dispatch(handleErrorWithAlert({ type: LOGIN_FAIL }, err));
    });
};

const initializePusher = (
  userData: UserData,
  token: string
): Promise<any | Error> => {
  return new Promise((resolve, reject) => {
    // if (!isProd && process.env.NODE_ENV !== 'test') {
    if (!isProd) {
      console.log('%cskipping Pusher', 'color: green');
      return resolve(userData);
    }
    console.log('initializePusher');

    setTimeout(() => {
      reject(new Error('Error connecting to Chat provider'));
    }, 30000);

    try {
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
          error: console.log,
          warn: console.log,
          info: () => {},
          debug: () => {},
          verbose: () => {},
        },
        connectionTimeout: 30 * 1000,
      });
      chatManager
        .connect()
        .then(user => {
          console.log('Pusher: connected');
          currentUser = user;
          resolve(userData);
          //   // Subscribe to all rooms the user is a member of
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
        .catch(err => {
          console.error(err);
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
};

// function onNewMessage(params) {
//   console.log(params);
// }

/* @DISABLED
const loginWithGoogle = () => (dispatch: Dispatch) => {
  dispatch({ type: GOOGLE_LOGIN_PENDING });

  GoogleSignin.hasPlayServices({ autoResolve: true });
  GoogleSignin.configure({
    iosClientId:
      '530398476253-s5dfiv2ilfn1nbrhk5otj8k2mnne101l.apps.googleusercontent.com', // only for iOS
  });
  return GoogleSignin.signIn()
    .then((user: GoogleUser) => {
      const provider = firebase.auth.GoogleAuthProvider;
      const credential = provider.credential(user.idToken);
      return firebase
        .auth()
        .signInWithCredential(credential)
        .then(user => {
          console.log('signed in with Google');
          const userData = {
            emailAddress: user.email,
            provider: 'google',
          };
          dispatch({ type: LOGIN_SUCCESS, payload: userData });
        })
        .catch(error => {
          dispatch({ type: LOGIN_FAIL, payload: error });
          console.error(`Login fail with error: ${error}`);
        });
    })
    .catch(error => {
      if (error.code == -5) console.debug('User cancelled Google Login');
      dispatch({ type: LOGIN_FAIL, payload: error });
    });
};
*/

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

const checkLogin = (userData: UserData, token: string) => (
  dispatch: Dispatch
) => {
  console.debug('checkLogin');
  dispatch({ type: 'RELOAD_PENDING' });
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
      console.debug('Push notifications: initialized');
      if (pushToken) return sendToken(pushToken, userData, token);
    })
    .catch(err => {
      console.debug(err);
      dispatch({ type: RELOAD_FAIL });
      ui.showToast(err.message || JSON.stringify(err), 'danger', 'OK', 5);
      throw err;
    });
};

const signup = (data: SignupData) => (dispatch: Dispatch) => {
  dispatch({ type: SIGNUP_PENDING });
  Toast.loading('', 30);
  return api
    .post('/api/users', {
      username: data.username,
      emailAddress: data.emailAddress,
      password: data.password,
    })
    .then(res => {
      if (res.data) {
        console.debug('user created', res.data);
        console.debug('token', res.token);
        // const userData: UserData = {
        //   ...res.data,
        //   ...{ token: res.token, provider: 'email' },
        // };

        if (analyticsEnabled) {
          trackUser(res.data);
          Analytics.track('signup');
        }

        // console.warn(userData);
        // if (userData.accountStatus !== 'verified') {
        return dispatch({ type: SIGNUP_SUCCESS });
        // }

        // initializePusher(userData)
        //   .then(() => registerPushNotifications())
        //   .then(pushToken => {
        //     if (pushToken) return sendToken(pushToken, userData);
        //   })
        //   .then(() => dispatch({ type: SIGNUP_SUCCESS, payload: userData }))
        //   .catch(err => {
        //     console.warn(err);
        //     dispatch({ type: SIGNUP_FAIL });
        //     Toast.hide();
        //   });
        // if (analyticsEnabled) trackUser(userData)
      }
      console.warn(res);
      dispatch({ type: SIGNUP_FAIL });
    })
    .catch((err: APIError) => {
      dispatch(
        handleErrorWithAlert(
          { type: SIGNUP_FAIL },
          err,
          I18n.t('product.toast_warning_ok_button')
        )
      );
      Toast.hide();
      throw err;
    })
    .then(() => Toast.hide());
};

const getPersonalUserData = (options?: Options = {}) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const { token, data } = getState().LoginReducer;
  Toast.loading(I18n.t('alerts.loading_message'), 30);
  dispatch({ type: GETUSER_PENDING });
  return api
    .get(`/api/users/${data._id}/personal`, { ...options, token })
    .then((res: UserData) => dispatch({ type: GETUSER_SUCCESS, payload: res }))
    .catch(err => dispatch(handleErrorWithAlert({ type: GETUSER_FAIL }, err)))
    .then(() => Toast.hide());
};

const getUserData = (userId: string, options?: Options = {}) => (
  dispatch: Dispatch
) => (
  Toast.loading(I18n.t('alerts.loading_message'), 30),
  dispatch({ type: GETUSER_PENDING }),
  api
    .get(`/api/users/${userId}`, options)
    .then((res: UserData) => {
      console.debug(res);
      dispatch({ type: GETUSER_SUCCESS, payload: res });
    })
    .catch(err => {
      dispatch(handleErrorWithAlert({ type: GETUSER_FAIL }, err));
    })
    .then(() => Toast.hide())
);

const logout = () => (dispatch: Dispatch) => {
  // const sb = SendBird.getInstance();
  // if (sb) {
  //   sb.disconnect(() => console.debug('SendBird: disconnected'));
  //   if (Platform.OS === 'ios') {
  //     setBadgeNumber(0).then(() => {
  //       console.debug('push badge reset to 0');
  //     });
  //   }
  //   sb.unregisterPushTokenAllForCurrentUser(() =>
  //     console.debug('SendBird: unregisterPushToken')
  //   );
  // }
  if (currentUser) {
    currentUser.disconnect();
    console.log('disconnected from Pusher');
  }
  if (analyticsEnabled) {
    Analytics.flush();
    Analytics.reset();
  }

  return dispatch({ type: LOGOUT });

  // const provider = getState().LoginReducer.data.provider;
  // if (provider == 'email') {
  //   return dispatch({ type: LOGOUT });
  // } else if (data.provider == 'google') {
  //   return GoogleSignin.signOut()
  //     .then(() => firebase.auth().signOut())
  //     .then(dispatch({ type: LOGOUT }));
  // }
};

const sendToken = (
  pushToken: string,
  userData: UserData,
  token: string
): Promise<any> => {
  const data = {
    platform: Platform.OS,
    pushToken,
  };

  return api
    .put(`/api/users/${userData._id}`, data, { token })
    .then(() => {
      console.debug('pushToken and platform sent');
      console.debug(data);
    })
    .catch(err => {
      console.error(err);
    });
};

const handleErrorWithAlert = (data: any, err: any, buttonText?) => {
  let errorType;
  if (err.status == 400 || err.status == 500) {
    errorType = 'danger';
  } else if (err.status == 401) {
    // auth error
    errorType = 'warning';

    if (err.message == 'invalid password') {
      err.message = I18n.t('alerts.password_error');
    } else if (err.message == 'invalid email') {
      err.message = I18n.t('alerts.email_error');
    }
  } else if (
    err.message.includes('timeout') ||
    err.message === 'Network Error'
  ) {
    errorType = 'danger';
    err.message = I18n.t('alerts.network_error');
    // } else if (err.message == 'operation_canceled') {
    //   return {
    //     type: data.type,
    //   };
  } else {
    console.error(err);
  }
  if (!global.__TESTING__) {
    ui.showToast(err.message, errorType || '', buttonText);
  }
  return {
    type: data.type,
  };
};

const enableRefresh = () => ({ type: DO_REFRESH });

const disableRefresh = () => ({ type: DONOT_REFRESH });

const enableCancelOrder = () => ({ type: 'DO_CANCEL_ORDER' });

const disableCancelOrder = () => ({ type: 'DONOT_CANCEL_ORDER' });

/*
const displayNotification = (notification: any) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const routes = getState().NavigationReducer.stateForLoggedIn.routes;
  const routeName = routes[routes.length - 1].routeName;
  console.log(routeName);
  // if we're NOT on the chat route/screen of the push notification, display the push
  if (routeName == 'chat') {
    const { params } = routes[routes.length - 1];
    console.log(params);
  } else {
    firebase.notifications().displayNotification(notification);
  }
};
*/

export {
  initializePusher,
  login,
  intro,
  // loginWithGoogle,
  checkLogin,
  signup,
  sendToken,
  getPersonalUserData,
  getUserData,
  logout,
  currentUser,
  enableRefresh,
  disableRefresh,
  enableCancelOrder,
  disableCancelOrder,
  // displayNotification,
};
