/* @flow */

export type Action = {
  type: string,
  payload?: {
    counter: number,
    token: string,
  },
};

export type LoginState = {
  +data: any,
  +fetchLoading: boolean,
  +hasError: boolean,
  +isLoggedIn: boolean,
  +loading: boolean,
  +loadingGoogleLogin: boolean,
  +token: string,
  // errorMsg: string | null,
};
