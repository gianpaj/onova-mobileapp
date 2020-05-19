/* @flow */

export type Action = {
  type: string,
  payload?: {
    token: string,
  },
};

import type { UserData } from './index';

export type LoginState = {
  // errorMsg: string,
  checkedLoggedIn: boolean,
  data?: UserData,
  fetchLoading: boolean,
  hasError: boolean,
  isAdmin: boolean,
  isLoggedIn: boolean,
  isVerifyAccountModalVisible: false,
  loading: boolean,
  skippedLogin: boolean,
  token: string,
};
