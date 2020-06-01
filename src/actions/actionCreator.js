// @flow

import { Platform } from 'react-native';
import { Toast } from 'antd-mobile-rn';
import { Toast as ToastNB } from 'native-base';
import Sendbird from 'sendbird';
import { Sentry } from 'react-native-sentry';
import Analytics from 'react-native-analytics-segment-io';
import { APP_NAME } from 'react-native-dotenv';

import * as ACTION_TYPES from './actionTypes';
import type { Dispatch, LoginData, SignupData, GetState, UserData } from '../types';
import type { Options, APIError } from '../utils/api';
import { addAuthBreadcrumb, addNavigationBreadcrumb, addErrorBreadcrumb } from '../utils/analytics';

import { registerPushNotifications } from '../utils/push';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';
import { initializeSendbird } from './sendbird.actions';

const { isProd, analyticsEnabled } = api;

// const enabledPusher = isProd == true;
export const enabledSendbird = true;

const login = (data: LoginData) => (dispatch: Dispatch) => {
  dispatch({ type: ACTION_TYPES.LOGIN_PENDING });
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
      dispatch({ type: ACTION_TYPES.LOGIN_SUCCESS, payload: userData });
      addNavigationBreadcrumb({ message: ACTION_TYPES.LOGIN_SUCCESS });
      return registerPushNotifications()
        .then(pushToken => sendToken(pushToken, userData, userData.token))
        .catch(err => {
          console.warn(err);
          dispatch({ type: ACTION_TYPES.LOGIN_FAIL });
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
        dispatch({ type: ACTION_TYPES.LOGIN_FAIL });
        throw error;
      }
      dispatch(handleErrorWithAlert({ type: ACTION_TYPES.LOGIN_FAIL }, error));
      addErrorBreadcrumb({
        category: 'auth',
        error,
        level: 'warning',
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
  dispatch({ type: ACTION_TYPES.RELOAD_PENDING });
  return api
    .get(`/api/users/${userData._id}/personal`, { token })
    .then(() => {
      if (analyticsEnabled) {
        trackUser(userData);
        Analytics.track('reload_login');
      }
    })
    .then(() => initializeSendbird(userData))
    .then(() => dispatch({ type: ACTION_TYPES.RELOAD_SUCCESS }))
    .then(() => registerPushNotifications())
    .then(pushToken => {
      if (enabledSendbird) {
        const sb = Sendbird.getInstance();
        if (sb) {
          sb.registerGCMPushTokenForCurrentUser(pushToken, (result, error) => {
            if (error) throw error;
          });
        }
      }
      sendToken(pushToken, userData, token);
      addNavigationBreadcrumb({ message: ACTION_TYPES.RELOAD_SUCCESS });
    })
    .catch(error => {
      dispatch({ type: ACTION_TYPES.RELOAD_FAIL });
      ui.showToast(error.message || JSON.stringify(error), 'danger', 'OK', 5);
      addErrorBreadcrumb({
        category: 'auth',
        error,
      });
      throw error;
    });
};

const signup = (data: SignupData) => (dispatch: Dispatch) => {
  dispatch({ type: ACTION_TYPES.SIGNUP_PENDING });
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
        dispatch({ type: ACTION_TYPES.SIGNUP_FAIL });
        addNavigationBreadcrumb({ message: ACTION_TYPES.SIGNUP_FAIL });
        return;
      }
      dispatch({ type: ACTION_TYPES.SIGNUP_SUCCESS });
      addNavigationBreadcrumb({ message: ACTION_TYPES.SIGNUP_SUCCESS });
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
      //   .then(() => dispatch({ type: ACTION_TYPES.SIGNUP_SUCCESS, payload: userData }))
      //   .catch(err => {
      //     console.warn(err);
      //     dispatch({ type: ACTION_TYPES.SIGNUP_FAIL });
      //   });
      // if (analyticsEnabled) trackUser(userData)
    })
    .catch((error: APIError) => {
      clearTimeout(timer);
      Toast.hide();
      dispatch(
        handleErrorWithAlert({ type: ACTION_TYPES.SIGNUP_FAIL }, error, I18n.t('product.toast_warning_ok_button'))
      );
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
  dispatch({ type: ACTION_TYPES.GETUSER_PENDING });
  return api
    .get(`/api/users/${data._id}/personal`, { ...options, token })
    .then((res: UserData) => dispatch({ type: ACTION_TYPES.GETUSER_SUCCESS, payload: res }))
    .catch(err => dispatch(handleErrorWithAlert({ type: ACTION_TYPES.GETUSER_FAIL }, err)))
    .then(() => Toast.hide());
};

const getUserData = (userId: string, options?: Options = {}) => (dispatch: Dispatch) => (
  Toast.loading(I18n.t('alerts.loading_message'), 30),
  dispatch({ type: ACTION_TYPES.GETUSER_PENDING }),
  api
    .get(`/api/users/${userId}`, options)
    .then((res: UserData) => dispatch({ type: ACTION_TYPES.GETUSER_SUCCESS, payload: res }))
    .catch(err => dispatch(handleErrorWithAlert({ type: ACTION_TYPES.GETUSER_FAIL }, err)))
    .then(() => Toast.hide())
);

const logout = () => {
  addNavigationBreadcrumb({ message: ACTION_TYPES.LOGOUT });
  // dispatch({ type: ACTION_TYPES.INTRO });

  console.log('disconnected from Sendbird');

  if (analyticsEnabled) {
    Sentry.captureBreadcrumb({
      category: 'chat',
      message: 'disconnected from Sendbird',
      level: 'info',
    });
    Analytics.flush();
    Analytics.reset();
  }

  return { type: ACTION_TYPES.LOGOUT };
};

const skip = () => (dispatch: Dispatch) => {
  const userId = APP_NAME == 'onova' ? '5afb40d0741c953ef07a616f' : '5cd41dba3fb2da4b20f427d3';
  dispatch({ type: 'SKIP_PENDING' });
  Toast.loading('', 30);
  api
    .get(`/api/users/${userId}`)
    .then((res: UserData) => {
      addAuthBreadcrumb({ message: 'skipped' });
      dispatch({ type: ACTION_TYPES.SKIPPED, payload: res });
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

const enableRefresh = () => ({ type: ACTION_TYPES.DO_REFRESH });

const disableRefresh = () => ({ type: ACTION_TYPES.DONOT_REFRESH });

const enableCancelOrder = () => ({ type: ACTION_TYPES.DO_CANCEL_ORDER });

const disableCancelOrder = () => ({ type: ACTION_TYPES.DONOT_CANCEL_ORDER });

export {
  login,
  checkLogin,
  signup,
  sendToken,
  getPersonalUserData,
  getUserData,
  logout,
  skip,
  enableRefresh,
  disableRefresh,
  enableCancelOrder,
  disableCancelOrder,
};
