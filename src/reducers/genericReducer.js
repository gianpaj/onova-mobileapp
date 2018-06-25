// @flow

import { DO_REFRESH, DONOT_REFRESH } from '../actions/actionTypes';
import type { Action } from '../types/loginReducer';

type ScreenRefreshReducerState = {
  shouldRefresh: boolean,
};

const initialState = {
  shouldRefresh: false,
};

export default function(
  state: ScreenRefreshReducerState = initialState,
  action: Action
) {
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

    default:
      return state;
  }
}
