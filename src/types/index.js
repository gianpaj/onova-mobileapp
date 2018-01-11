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
  paymentInfo: {
    last_four: string,
    exp_month: string,
    exp_year: string,
  },
  shippingInfo: ShippingInfo,
};

export type PaymentInfo = {
  valid: boolean,
  values: {
    expiry: string,
    number: string,
  },
};

export type ShippingInfo = {
  line1: string,
  line2: string,
  city: string,
  state: string,
  country: string,
  postcode: string,
};

// export type Store = ReduxStore<State, Action>;

// export type Dispatch = ReduxDispatch<Action>;
export type Dispatch = ReduxDispatch<any>;
