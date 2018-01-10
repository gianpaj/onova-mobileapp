// @flow
// import * as firebase from 'firebase';
// import { GoogleSignin, User as GoogleUser } from 'react-native-google-signin';

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
  SIGNUP,
  BACK,
} from './actionTypes';
import type { Dispatch, LoginData, SignupData } from '../types';
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
        // @TODO: send analytics login event
        dispatch({ type: LOGIN_SUCCESS, payload: userData });
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

const getUserData = (userId: string) => (dispatch: Dispatch) => (
  dispatch({ type: 'GETUSER_PENDING' }),
  api
    .get(`/api/users/${userId}`)
    .then(res => {
      console.debug(res);
      dispatch({ type: 'GETUSER_SUCCESS', payload: res });
    })
    .catch(err => {
      dispatch(handleErrorWithAlert({ type: 'GETUSER_FAIL' }, err));
    })
);

const logout = (data: any) => (dispatch: Dispatch) => {
  console.log(data);
  if (data.provider == 'email') {
    return dispatch({ type: LOGOUT });
    // } else if (data.provider == 'google') {
    //   return GoogleSignin.signOut()
    //     .then(() => firebase.auth().signOut())
    //     .then(dispatch({ type: LOGOUT }));
  }
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
  login,
  // loginWithGoogle,
  signup,
  getUserData,
  logout,
  goToSignup,
  goback,
};
