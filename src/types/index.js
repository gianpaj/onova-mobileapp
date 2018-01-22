// @flow
import type { Dispatch as ReduxDispatch } from 'redux';
import type { Reducers } from '../reducers';

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
  user: {
    _id: number,
    name: string,
    avatar: string,
  },
};

type $ExtractFunctionReturn = <V>(v: (...args: any) => V) => V;
export type State = $ObjMap<Reducers, $ExtractFunctionReturn>;
// export type Store = ReduxStore<State, Action>;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ReduxDispatch<any>;
export type GetState = () => State;
