// @flow

import {
  LOGIN_PENDING,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  // GOOGLE_LOGIN_PENDING,
  SIGNUP_PENDING,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  LOGOUT,
  RELOAD_SUCCESS,
  RELOAD_FAIL,
  GETUSER_PENDING,
  GETUSER_SUCCESS,
  GETUSER_FAIL,
} from '../actions/actionTypes';
import type { Action, LoginState } from '../types/loginReducer';

const initialState: LoginState = {
  // errorMsg: null,
  checkedLoggedIn: false,
  data: null,
  fetchLoading: false,
  hasError: false,
  isLoggedIn: false,
  isVerifyAccountModalVisible: false,
  loading: false,
  // loadingGoogleLogin: false,
  token: '',
};

export default function(
  state: LoginState = initialState,
  action: Action
): LoginState {
  switch (action.type) {
    case LOGIN_PENDING:
    case SIGNUP_PENDING:
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
      return { ...state, isVerifyAccountModalVisible: true };

    case LOGIN_SUCCESS:
      const thisState = {
        ...state,
        checkedLoggedIn: true,
        isLoggedIn: true,
        loading: false,
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
        // loadingGoogleLogin: false,
        token: '',
      };

    case 'RELOAD_PENDING':
      return {
        ...state,
        hasError: false,
        loading: true,
        checkedLoggedIn: false,
      };

    case RELOAD_SUCCESS:
      return { ...state, hasError: false, checkedLoggedIn: true };

    case RELOAD_FAIL:
      return {
        ...state,
        hasError: true,
        loading: false,
        checkedLoggedIn: false,
      };

    case 'INTRO':
      return {
        ...state,
        hasError: true,
        loading: false,
        isVerifyAccountModalVisible: false,
      };

    // case GOOGLE_LOGIN_PENDING:
    //   return {
    //     ...state,
    //     data: null,
    //     hasError: false,
    //     isLoggedIn: false,
    //     loading: false,
    //     loadingGoogleLogin: true,
    //     // errorMsg: null,
    //   };

    case LOGOUT:
      return {
        ...state,
        data: null,
        token: '',
        isLoggedIn: false,
        loading: false,
        // loadingGoogleLogin: false,
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
