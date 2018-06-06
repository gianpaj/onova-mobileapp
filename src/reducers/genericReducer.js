// @flow

// import { LOGIN_PENDING } from '../actions/actionTypes';
import type { Action, LoginState } from '../types/loginReducer';

const initialState = {
  shouldRefresh: false,
};

export default function(state = initialState, action: Action) {
  switch (action.type) {
    case 'DO_REFRESH':
      return {
        ...state,
        shouldRefresh: true,
      };

    case 'DONOT_REFRESH':
      return {
        ...state,
        shouldRefresh: false,
      };

    default:
      return state;
  }
}
