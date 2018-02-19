/* @flow */

export type Action = {
  type: string,
  payload?: {
    counter: number,
    token: string,
  },
};

export type LoginState = {
  // isLoading: boolean,
  // isHydrated: boolean,
  isLoggedIn: boolean,
  loading: boolean,
  loadingGoogleLogin: boolean,
  data: any,
  hasError: boolean,
  // errorMsg: string | null,
  fetchLoading: boolean,
  token: string,
};
