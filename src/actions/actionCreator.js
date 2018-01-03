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
        // this.afterLogin(userData);
      } else {
        console.debug(res);
        dispatch({ type: LOGIN_FAIL });
        // ui.showToast(res.toString());
      }
    })
    .catch((err: api.APIError) => {
      if (err.status == 400 || err.status == 500) {
        // ui.showToast(err.message, 'danger');
      } else if (err.status == 401) {
        // auth error
        // ui.showToast(err.message, 'warning');
      } else if (err.message == 'timeout') {
        // ui.showToast(
        //   'Onova servers might be taking a nap. Please retry',
        //   'warning'
        // );
      } else {
        console.error(err);
      }
      dispatch({ type: LOGIN_FAIL, payload: err });
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
        // ui.showToast(res.toString());
      }
    })
    .catch((err: api.APIError) => {
      if (err.status == 400) {
        // ui.showToast(err.message);
      }
      dispatch({ type: SIGNUP_FAIL, payload: err.message });
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

export {
  incrementAction,
  decrementAction,
  login,
  // loginWithGoogle,
  signup,
  logout,
  goToSignup,
  goback,
};
