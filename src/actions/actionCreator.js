/*global sb*/
// @flow

// import * as firebase from 'firebase';
// import { GoogleSignin, User as GoogleUser } from 'react-native-google-signin';

import SendBird from 'sendbird';
import { Toast } from 'antd-mobile';

import {
  incrementCounter,
  decrementCounter,
  LOGIN_PENDING,
  LOGIN_FAIL,
  LOGIN_SUCCESS,
  // GOOGLE_LOGIN_PENDING,
  SIGNUP_PENDING,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  LOGOUT,
  GETUSER_PENDING,
  GETUSER_SUCCESS,
  GETUSER_FAIL,
  SIGNUP,
  BACK,
} from './actionTypes';
import type {
  Dispatch,
  LoginData,
  SignupData,
  GetState,
  UserData,
} from '../types';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

const incrementAction = () => ({
  type: incrementCounter,
});

const decrementAction = () => ({
  type: decrementCounter,
});

const login = (data: LoginData) => (dispatch: Dispatch) => (
  dispatch({ type: LOGIN_PENDING }),
  // setTimeout(() => {

  api
    .post('/api/auth/login', {
      emailAddress: data.emailAddress,
      password: data.password,
    })
    .then(res => {
      if (res.data) {
        console.debug('user logged in via email');
        const userData = {
          ...res.data,
          ...{ token: res.token, provider: 'email' },
        };
        // @TODO:1 send analytics login event
        initializeSendBird(userData)
          .then(() => {
            // @FIXME: fix use `userData` key in payload
        dispatch({ type: LOGIN_SUCCESS, payload: userData });
          })
          .catch(err => {
            console.warn(err);
            dispatch({ type: LOGIN_FAIL });
          });
      } else {
        console.debug(res);
        dispatch({ type: LOGIN_FAIL });
      }
    })
    .catch((err: api.APIError) => {
      dispatch(handleErrorWithAlert({ type: LOGIN_FAIL }, err));
    })
  // }, 5000)
);

const initializeSendBird = (userData: UserData): Promise<any> => {
  return new Promise((resolve, reject) => {
    // $FlowFixMe
    sb = new SendBird({ appId: settings.SENDBIRD_APP_ID });
    sb.connect(userData._id, (user, err) => {
      if (err) return reject(err);

      sb.updateCurrentUserInfo(userData.username, '', (res, err) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  });
};

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

const signup = (data: SignupData) => (dispatch: Dispatch) => (
  dispatch({ type: SIGNUP_PENDING }),
  api
    .post('/api/users', {
      username: data.username,
      emailAddress: data.emailAddress,
      password: data.password,
    })
    .then(res => {
      if (res.data) {
        console.debug('user created', res.data);
        console.debug('token', res.token);
        const userData = {
          ...res.data,
          ...{ token: res.token, provider: 'email' },
        };
        dispatch({ type: SIGNUP_SUCCESS, payload: userData });
      } else {
        console.warn(res);
        dispatch({ type: SIGNUP_FAIL });
      }
    })
    .catch((err: api.APIError) => {
      dispatch(handleErrorWithAlert({ type: SIGNUP_FAIL }, err));
    })
);

const getPersonalUserData = (userId: string, options: any) => (
  dispatch: Dispatch
) => (
  Toast.loading('Loading...', 30),
  dispatch({ type: GETUSER_PENDING }),
  api
    .get(`/api/users/${userId}/personal`, options)
    .then(res => {
      console.debug(res);
      dispatch({ type: GETUSER_SUCCESS, payload: res });
    })
    .catch(err => {
      dispatch(handleErrorWithAlert({ type: GETUSER_FAIL }, err));
    })
    .then(() => Toast.hide())
);

const getUserData = (userId: string, options: any) => (dispatch: Dispatch) => (
  Toast.loading('Loading...', 30),
  dispatch({ type: GETUSER_PENDING }),
  api
    .get(`/api/users/${userId}`, options)
    .then(res => {
      console.debug(res);
      dispatch({ type: GETUSER_SUCCESS, payload: res });
    })
    .catch(err => {
      dispatch(handleErrorWithAlert({ type: GETUSER_FAIL }, err));
    })
    .then(() => Toast.hide())
);

const logout = () => (dispatch: Dispatch, getState: GetState) => {
  // $FlowFixMe
  sb.disconnect();
  // const provider = getState().LoginReducer.data.provider;
  // if (provider == 'email') {
  return dispatch({ type: LOGOUT });
  // } else if (data.provider == 'google') {
  //   return GoogleSignin.signOut()
  //     .then(() => firebase.auth().signOut())
  //     .then(dispatch({ type: LOGOUT }));
  // }
};

const goToSignup = () => ({
  type: SIGNUP,
});

const goback = () => ({
  type: BACK,
});

const handleErrorWithAlert = (data: any, err: any) => {
  let errorType;
  if (err.status == 400 || err.status == 500) {
    errorType = 'danger';
  } else if (err.status == 401) {
    // auth error
    errorType = 'warning';
  } else if (err.message.includes('timeout')) {
    err.message = 'Onova servers might be taking a nap. Please retry';
    errorType = 'danger';
  } else if (err.message == 'operation_canceled') {
    return {
      type: data.type,
    };
  } else {
    console.error(err);
  }
  ui.showToast(err.message, errorType || '');
  return {
    type: data.type,
  };
};

export {
  incrementAction,
  decrementAction,
  initializeSendBird,
  login,
  // loginWithGoogle,
  signup,
  getPersonalUserData,
  getUserData,
  logout,
  goToSignup,
  goback,
};
