/* @flow */

export type Action = {
  type: string,
  payload?: {
    token: string,
  },
};

export type LoginState = {
  +checkedLoggedIn: boolean,
  +isAdmin: boolean,
  +data: any,
  +fetchLoading: boolean,
  +hasError: boolean,
  +isLoggedIn: boolean,
  +loading: boolean,
  +isVerifyAccountModalVisible: false,
  +token: string,
  // +errorMsg: string,
};
