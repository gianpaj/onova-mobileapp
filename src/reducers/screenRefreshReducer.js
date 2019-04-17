// @flow

import { DO_REFRESH, DONOT_REFRESH } from '../actions/actionTypes';
import type { Action } from '../types/loginReducer';

export type ScreenRefreshState = {
  shouldRefresh: boolean,
  shouldCancelOrder: boolean,
};

const initialState = {
  shouldRefresh: false,
  shouldCancelOrder: true,
};

export default function(state: ScreenRefreshState = initialState, action: Action) {
  switch (action.type) {
    case DO_REFRESH:
      return {
        ...state,
        shouldRefresh: true,
      };

    case DONOT_REFRESH:
      return {
        ...state,
        shouldRefresh: false,
      };

    case 'DO_CANCEL_ORDER':
      return {
        ...state,
        shouldCancelOrder: true,
      };

    case 'DONOT_CANCEL_ORDER':
      return {
        ...state,
        shouldCancelOrder: false,
      };

    default:
      return state;
  }
}
