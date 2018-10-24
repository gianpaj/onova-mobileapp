// @flow
import type { Store as ReduxStore } from 'redux';
// import type { Reducers } from '../reducers';
import type { Action as LoginAction, LoginState } from './loginReducer';
import type { ScreenRefreshState } from '../reducers/screenRefreshReducer';
import type {
  Action as NavigationAction,
  NavigationState,
} from './navigationReducer';

export type ProductStatus =
  | 'forsale'
  | 'reserved'
  | 'sold'
  | 'banned'
  | 'deleted';

export type Product = {
  categoryIds: Array<number>,
  comments?: Array<Comment>,
  createdAt: string,
  currency: string,
  description: string,
  locality: string,
  photoURIs: Array<string>,
  price: string,
  seller: UserData,
  status: ProductStatus,
  tags?: Array<string>,
  typeIds: Array<number>,
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
  bio?: string,
  displayName?: string,
  emailAddress: string,
  followersCount: number,
  followingCount: number,
  sharedCount: number,
  mobileNumber: ?string,
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
  firstName: string,
  lastName: string,
  fathersName?: string,
  departmentNovaposhta: string,
  city: string,
};

// export type Message = {
//   _id: string,
//   text: string,
//   createdAt: Date,
//   user?: {
//     _id: string,
//     name: string,
//     avatar: string,
//   },
//   system?: boolean,
//   sent?: boolean,
//   received?: boolean,
//   image?: File,
// };

export type PusherMessage = {
  attachment?: {
    link: string,
    type: 'image', // | 'video' | 'blahblah',
    fetchRequired: boolean,
  },
  createdAt: number,
  id: number,
  image: string,
  received?: boolean,
  room: number,
  sender: number,
  senderId: string,
  sent?: boolean,
  text: string,
  updatedAt: number,
};

// export type PusherUser = {
//   avatarURL: string,
//   // eslint-disable-next-line
//   createRoom: (name: string, private: boolean, addUserIds: Array<strings>) => Promise<any>,
//   fetchMessages: any => {},
//   fetchAttachment: any => (,
//   id: number,
//   joinRoom: () => {},
//   name: string,
//   readCursor: any => any,
//   rooms: Array<Room>,
//   roomSubscriptions: any,
//   sendMessage: () => {},
//   users: Array<any>,
// };

export type Room = {
  createdAt: string,
  id: number,
  isPrivate: boolean,
  name: string,
  updatedAt: string,
  users: Array<string>,
  lastMessage: *,
  isPartnerOnline: *,
  partner: PusherUser,
  order: any,
};

type UserDataShorter = {
  _id: string,
  accountStatus: string,
  displayName: string,
  shippingAddress?: string,
  id: string,
  profilePic: string,
  username: string,
};

export type Order = {
  archivedBySeller: boolean,
  archivedByBuyer: boolean,
  id: string,
  buyer: UserDataShorter,
  citySender: string,
  cityRecipient: string,
  currency: string,
  dateCancelled: ?Date,
  dateCompleted: ?Date,
  dateConfirmed: ?Date,
  dateDelivered: ?Date,
  datePaid: ?Date,
  datePending: Date,
  dateShipped: ?Date,
  onovaFee: number,
  paymentMethod: ?string,
  priceOfItem: number,
  product: {
    currency: string,
    photoURIs: Array<string>,
    price: string,
    status: string,
    uuid: string,
  },
  // reason: ?string,
  reviewFromBuyer: ?string,
  reviewFromSeller: ?string,
  seller: UserDataShorter,
  status: string,
  // taxAmount: ?number;
  trackingNumber: ?string,
  transactionId: ?string,
  transactionFee: number,
  transactionStatus: ?string,
  total: number,
  shippingFee: ?number,
  shippingProvider: ?string,
  // shippingStatus: string,
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

export type Schedule = {
  products: Array<Product>,
};

type TriggeredType = 'User' | 'Product' | 'Order';

export type Notification = {
  data: ?{
    commentId: ?string,
    productUuid: ?string,
    senderName: ?string,
    text: ?string,
  },
  dateCreated: Date,
  notifI18n: string,
  sourceUser: UserData,
  targetUser: string,
  triggeredBy: any,
  triggeredType: TriggeredType,
};

export type City = {
  id: string,
  uk: string,
};

export type Department = {
  id: string,
  uk: string,
};

export type ReduxState = {
  LoginReducer: LoginState,
  RefresherReducer: ScreenRefreshState,
  NavigationReducer: NavigationState,
};

export type ReduxAction = LoginAction | NavigationAction;
export type Store = ReduxStore<ReduxState, ReduxAction>;

type PromiseAction = Promise<ReduxAction>;

type ThunkAction = (dispatch: Dispatch, getState: GetState) => any;
export type Dispatch = (
  action: ReduxAction | ThunkAction | PromiseAction
) => any;
export type GetState = () => ReduxState;
