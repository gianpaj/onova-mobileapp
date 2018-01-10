// @flow
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux';

// export type Product = {
//   id: Id,
//   text: Text,
//   completed: boolean,
// };

export type LoginData = {
  emailAddress: string,
  password: string,
};

export type SignupData = LoginData & {
  username: string,
};

export type LoginActionTypes = 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED';

export type UserData = {
  _id: string,
  accountStatus: string,
  emailAddress: string,
  provider: string,
  token: string,
  username: string,
  paymentInfo: any,
};

// export type Store = ReduxStore<State, Action>;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ReduxDispatch<any>;
