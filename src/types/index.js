// @flow
import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux';
// import type { Reducers } from '../reducers';
import type { Action as LoginAction, LoginState } from './loginReducer';
import type {
  Action as NavigationAction,
  NavigationState,
} from './navigationReducer';

export type Product = {
  categoryIds: Array<number>,
  comments?: Array<Comment>,
  createdAt: string,
  currency: string,
  description: string,
  photoURIs: Array<string>,
  price: string,
  seller: UserData,
  status: string,
  tags?: Array<string>,
  typeIds?: Array<number>,
  uuid: string,
};

export type Comment = {
  _id: string,
  text: string,
  createdAt: Date,
  user: UserData,
};

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
  // billingAddress: ?any;
  bio?: string,
  displayName?: string,
  emailAddress: string,
  followersCount: number,
  followingCount: number,
  // mobileNumber: ?string;
  // password: string;
  paymentInfo?: {
    last_four: string,
    exp_month: string,
    exp_year: string,
  },
  platform: ?string,
  profilePic?: string,
  pushToken: ?string,
  ratingsTotal: number,
  reviewsCount: number,
  shippingAddress?: ShippingAddress,
  token: string,
  username: string,
};

export type PaymentInfo =
  | {
      valid: boolean,
      values: {
        expiry: string,
        number: string,
      },
    }
  | {};

export type ShippingAddress = {
  line1: string,
  line2: string,
  city: string,
  state: string,
  country: string,
  postcode: string,
};

export type Message = {
  _id: string,
  text: string,
  createdAt: Date,
  user?: {
    _id: string,
    name: string,
    avatar: string,
  },
  system?: boolean,
  sent?: boolean,
  received?: boolean,
  image?: File,
};

export type SendBirdMessage = {
  messageId: string,
  message: string,
  messageType: string,
  data: string,
  customType: string,
  createdAt: number,
  updatedAt: number,
  sender: any,
  sent?: boolean,
  received?: boolean,

  isUserMessage(): boolean,
  isFileMessage(): boolean,
  isAdminMessage(): boolean,
};

export type Order = {
  id: string,
  buyer: {
    _id: string,
    accountStatus: string,
    id: string,
    profilePic: string,
    username: string,
  },
  priceOfItem: number,
  product: string | Product,
  seller: {
    _id: string,
    accountStatus: string,
    id: string,
    profilePic: string,
    username: string,
  },
  status: string,
  transationFee?: number,
  reviewedByBuyer: boolean,
  reviewedBySeller: boolean,
  // lastMessage: Message,
  // unreadMessageCount: number,
};

export type Review = {
  id: string,
  order: Order,
  fromUser: string,
  targetUser: string,
  text: string,
  rateNumber: number,
  lang: string,
  createdAt: Date,
};

export type ReduxState = {
  LoginReducer: LoginState,
  NavigationReducer: NavigationState,
};

export type ReduxAction = LoginAction | NavigationAction;
export type Store = ReduxStore<ReduxState, ReduxAction>;

export type Dispatch = ReduxDispatch<ReduxAction>;
export type GetState = () => ReduxState;
