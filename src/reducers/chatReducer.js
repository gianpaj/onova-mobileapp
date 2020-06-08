// @flow

import * as ACTION_TYPES from '../actions/actionTypes';
import type { Action, ChatState } from '../types/chatReducer';

import type { SendbirdMessage } from '../types';

const initialState: ChatState = {
  list: [],
  memberCount: 0,
  unreadCount: 0,
  title: '',
  exit: false,
  typing: '',
  selectedMessages: [],
};

const uniqueList = (list: Array<SendbirdMessage>): Array<SendbirdMessage> =>
  list.reduce((uniqList, currentValue) => {
    const ids = uniqList.map(item => item.messageId);
    if (ids.indexOf(currentValue.messageId) < 0) {
      uniqList.push(currentValue);
    }
    return uniqList;
  }, []);

export default (state: ChatState = initialState, action: Action): ChatState => {
  switch (action.type) {
    case ACTION_TYPES.INIT_CHAT_SCREEN:
      return { ...state, ...initialState };
    case ACTION_TYPES.CREATE_CHAT_HANDLER_SUCCESS:
    case ACTION_TYPES.CREATE_CHAT_HANDLER_FAIL:
      return { ...state };
    case ACTION_TYPES.CHANNEL_CHANGED:
      return { ...state, memberCount: action.memberCount, title: action.title };
    case ACTION_TYPES.CHANNEL_CHANGED_FAIL:
      return { ...state };
    case ACTION_TYPES.MESSAGE_LIST_SUCCESS:
      return { ...state, list: uniqueList([...state.list, ...(action.list || [])]) };
    case ACTION_TYPES.MESSAGE_LIST_FAIL:
      return { ...state };
    case ACTION_TYPES.SEND_MESSAGE_TEMPORARY:
      return { ...state, list: [action.message, ...state.list] };
    case ACTION_TYPES.SEND_MESSAGE_SUCCESS:
      const newMessage = action.message;
      let foundNewMessage = false;
      const sendSuccessList = state.list.map(message => {
        if (message.reqId && newMessage.reqId && message.reqId.toString() === newMessage.reqId.toString()) {
          foundNewMessage = true;
          return newMessage;
        }
        return message;
      });
      if (foundNewMessage) {
        return { ...state, list: sendSuccessList };
      }
      return { ...state, list: [newMessage, ...sendSuccessList] };
    case ACTION_TYPES.SEND_MESSAGE_FAIL:
      const newChatList = state.list.slice(1);
      return { ...state, list: newChatList };
    case ACTION_TYPES.CHANNEL_EXIT_SUCCESS:
      return { ...state, exit: true };
    case ACTION_TYPES.CHANNEL_EXIT_FAIL:
      return { ...state, exit: false };
    case ACTION_TYPES.USER_MESSAGE_PRESS:
      const newSelectedMessage = action.message;
      return { ...state, selectedMessages: [newSelectedMessage] };
    case ACTION_TYPES.USER_MESSAGE_SELECTION_CLEAR:
      return { ...state, selectedMessages: [] };
    case ACTION_TYPES.MESSAGE_RECEIVED:
      return { ...state, list: uniqueList([...[action.payload], ...state.list]) };
    case ACTION_TYPES.MESSAGE_UPDATED:
      const updatedMessage = action.payload;
      const updatedList = state.list.map(message => {
        // $FlowFixMe
        if (message.messageId === updatedMessage.messageId) {
          message = updatedMessage;
        }
        return message;
      });
      return { ...state, list: updatedList };
    case ACTION_TYPES.MESSAGE_DELETED:
      const deletedList = state.list.filter(message => message.messageId.toString() !== action.payload.toString());
      return { ...state, list: deletedList };
    case ACTION_TYPES.TYPING_STATUS_UPDATED:
      return { ...state, typing: action.typing };
    case ACTION_TYPES.READ_RECEIPT_UPDATED:
    case ACTION_TYPES.OWN_MESSAGE_DELETED_FAIL:
      return state;
    case ACTION_TYPES.OWN_MESSAGE_DELETED:
      return { ...state, selectedMessages: [] };
    case ACTION_TYPES.OWN_MESSAGE_UPDATED:
      const editedMessage = action.edited;
      const updatedList2 = state.list.map(message => {
        // $FlowFixMe
        if (message.messageId === editedMessage.messageId) {
          message.isEdited = true;
          message.message = action.contents;
        }
        return message;
      });
      return { ...state, selectedMessages: [], list: updatedList2 };
    case 'SENDBIRD_UNREADCOUNTER_FAIL':
      return {
        ...state,
        unreadCount: 0,
        isFetchinUnreadCount: false,
      };
    case 'SENDBIRD_UNREADCOUNTER_SUCCESS':
      return {
        ...state,
        unreadCount: action.payload,
      };
    case ACTION_TYPES.OWN_MESSAGE_UPDATED_FAIL:
    default:
      return state;
  }
};
