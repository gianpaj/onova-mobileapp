// @flow
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux';
import type { Reducers } from '../reducers';
import type { Action as LoginAction, LoginState } from './loginReducer';
import type {
  Action as NavigationAction,
  NavigationState,
} from './navigationReducer';

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

export type UserData = {
  _id: string,
  accountStatus: string,
  bio?: string,
  displayName?: string,
  emailAddress: string,
  provider: string,
  profilePic?: string,
  token: string,
  username: string,
  paymentInfo: {
    last_four: string,
    exp_month: string,
    exp_year: string,
  },
  shippingAddress: ShippingAddress,
};

export type PaymentInfo = {
  valid: boolean,
  values: {
    expiry: string,
    number: string,
  },
};

export type ShippingAddress = {
  line1: string,
  line2: string,
  city: string,
  state: string,
  country: string,
  postcode: string,
};

export type Message = {
  _id: number,
  text: string,
  createdAt: Date,
  user?: {
    _id: string,
    name: string,
    avatar: string,
  },
  system?: boolean,
};

export type ReduxState = {
  LoginReducer: LoginState,
  NavigationReducer: NavigationState,
};

export type ReduxAction = LoginAction | NavigationAction;
export type Store = ReduxStore<ReduxState, ReduxAction>;

export type Dispatch = ReduxDispatch<ReduxAction>;
// export type Dispatch = ReduxDispatch<any>;
export type GetState = () => ReduxState;
