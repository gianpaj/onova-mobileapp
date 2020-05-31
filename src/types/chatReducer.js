/* @flow */
import Sendbird from 'sendbird';

export type SendbirdMessage = Sendbird.AdminMessage | Sendbird.UserMessage | Sendbird.FileMessage;

export type Action = {
  contents?: SendbirdMessage,
  memberCount: number,
  list: Array<SendbirdMessage>,
  message: SendbirdMessage,
  edited?: SendbirdMessage,
  payload?: SendbirdMessage | string,
  title: string,
  type: string,
  typing: string,
};

// import type { UserData } from './index';

export type ChatState = {
  exit: boolean,
  list: Array<SendbirdMessage>,
  memberCount: number,
  selectedMessages: Array<SendbirdMessage>,
  title: string,
  typing: string,
};
