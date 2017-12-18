// @flow

import {
  incrementCounter,
  decrementCounter,
  LOGIN_PENDING,
  LOGIN_FAIL,
  LOGIN_SUCCESS,
  Logout,
} from './actionTypes';
import * as api from '../utils/api';

const incrementAction = () => ({
  type: incrementCounter,
});

const decrementAction = () => ({
  type: decrementCounter,
});

const login = data => dispatch => (
  dispatch({ type: LOGIN_PENDING }),
  // setTimeout(() => {

  api
    .post('/api/auth/login', {
      emailAddress: data.emailAddress,
      password: data.password,
    })
    .then(res => {
      if (res.data) {
        console.log('user logged in via email');
        const userData = {
          ...res.data,
          ...{ token: res.token, provider: 'email' },
        };
        dispatch({ type: LOGIN_SUCCESS, payload: userData });
        // this.afterLogin(userData);
      } else {
        console.log(res);
        dispatch({ type: LOGIN_FAIL });
        // ui.showToast(res.toString());
      }
    })
    .catch((err: api.APIError) => {
      if (err.status == 400 || err.status == 500) {
        // ui.showToast(err.message, 'danger');
        dispatch({ type: LOGIN_FAIL, payload: err });
      } else if (err.status == 401) {
        // auth error
        dispatch({ type: LOGIN_FAIL, payload: err });
        // ui.showToast(err.message, 'warning');
      } else if (err.message == 'timeout') {
        dispatch({ type: LOGIN_FAIL, payload: err });
        // ui.showToast(
        //   'Onova servers might be taking a nap. Please retry',
        //   'warning'
        // );
      } else {
        console.log(err);
      }
    })
  // }, 5000)
);

const logout = () => ({
  type: Logout,
});

export { incrementAction, decrementAction, login, logout };
