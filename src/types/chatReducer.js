/* @flow */

import type { SendbirdMessage } from './';

export type Action = {
  contents?: SendbirdMessage,
  memberCount?: number,
  list?: Array<SendbirdMessage>,
  message?: SendbirdMessage,
  edited?: SendbirdMessage,
  payload?: SendbirdMessage | string | number,
  title?: string,
  type: string,
  typing?: string,
};

// import type { UserData } from './index';

export type ChatState = {
  +exit: boolean,
  +list: Array<SendbirdMessage>,
  +memberCount: number,
  +unreadCount: number,
  +selectedMessages: Array<SendbirdMessage>,
  +title: string,
  +typing: string,
};
