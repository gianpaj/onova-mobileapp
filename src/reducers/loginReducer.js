// @flow

import { APP_NAME } from 'react-native-dotenv';

import {
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
} from '../actions/actionTypes';
import type { Action, LoginState } from '../types/loginReducer';

const initialState: LoginState = {
  // errorMsg: null,
  checkedLoggedIn: false,
  data: null,
  fetchLoading: false,
  hasError: false,
  isAdmin: false,
  isLoggedIn: false,
  isVerifyAccountModalVisible: false,
  loading: false,
  skippedLogin: false,
  token: '',
};

export default function(state: LoginState = initialState, action: Action): LoginState {
  let isAdmin = false;
  if (state.data && ['alex', 'onova', 'gianpaj'].includes(state.data.username)) {
    isAdmin = true;
  }

  switch (action.type) {
    case LOGIN_PENDING:
    case SIGNUP_PENDING:
    case 'SKIP_PENDING':
      return {
        ...state,
        checkedLoggedIn: false,
        data: null,
        hasError: false,
        isLoggedIn: false,
        isVerifyAccountModalVisible: false,
        loading: true,
      };

    case SIGNUP_SUCCESS:
      return {
        ...state,
        isVerifyAccountModalVisible: true,
        loading: false,
        skippedLogin: false,
      };

    case SKIPPED:
      // eslint-disable-next-line no-unused-vars
      const { token, ...noToken } = action.payload;
      return {
        ...state,
        data: { ...noToken, shippingAddress: {}, paymentInfo: { short: {}, full: {} } },
        isAdmin: false,
        isLoggedIn: true,
        skippedLogin: true,
        isVerifyAccountModalVisible: false,
        checkedLoggedIn: true,
        loading: false,
      };

    case 'SKIPPED_FAIL':
      return {
        ...state,
        isLoggedIn: true,
        skippedLogin: true,
        fetchLoading: false,
        hasError: true,
      };

    case LOGIN_SUCCESS:
      const thisState = {
        ...state,
        isAdmin,
        checkedLoggedIn: true,
        isLoggedIn: true,
        loading: false,
        skippedLogin: false,
      };
      if (action.payload) {
        const { token, ...noToken } = action.payload;
        return {
          ...thisState,
          data: noToken,
          token,
        };
      } else {
        return {
          ...thisState,
        };
      }

    case LOGIN_FAIL:
    case SIGNUP_FAIL:
      return {
        ...state,
        checkedLoggedIn: false,
        data: null,
        hasError: true,
        isLoggedIn: false,
        isVerifyAccountModalVisible: false,
        loading: false,
        token: '',
      };

    case RELOAD_PENDING:
      return {
        ...state,
        hasError: false,
        loading: true,
        checkedLoggedIn: false,
      };

    case RELOAD_SUCCESS:
      return {
        ...state,
        hasError: false,
        isAdmin,
        checkedLoggedIn: true,
        skippedLogin: false,
      };

    case RELOAD_FAIL:
      return {
        ...state,
        hasError: true,
        loading: false,
        checkedLoggedIn: false,
      };

    // case INTRO:
    //   return {
    //     ...state,
    //     hasError: true,
    //     loading: false,
    //     isVerifyAccountModalVisible: false,
    //   };

    case LOGOUT:
      return {
        ...state,
        data: null,
        token: '',
        isLoggedIn: false,
        loading: false,
      };

    case GETUSER_PENDING:
      return {
        ...state,
        fetchLoading: true,
      };

    case GETUSER_SUCCESS:
      return {
        ...state,
        data: { ...state.data, ...action.payload },
        fetchLoading: false,
        hasError: false,
      };

    case GETUSER_FAIL:
      return {
        ...state,
        fetchLoading: false,
        hasError: true,
      };

    default:
      return state;
  }
}
