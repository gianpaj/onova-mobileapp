// @flow
import { NavigationActions } from 'react-navigation';

import NavigationStack from '../navigation/navigationStack';
import { LOGIN_SUCCESS, SIGNUP_SUCCESS, LOGOUT } from '../actions/actionTypes';

import type { Action } from '../types/navigationReducer';

const ActionForLoggedOut = NavigationStack.router.getActionForPathAndParams(
  'signuplogin'
);

const ActionForLoggedIn = NavigationActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'tabs' })],
});

const stateForLoggedOut = NavigationStack.router.getStateForAction(
  ActionForLoggedOut
);
const stateForLoggedIn = NavigationStack.router.getStateForAction(
  ActionForLoggedIn
);

const initialState = { stateForLoggedOut, stateForLoggedIn };

const navigationReducer = (state: any = initialState, action: Action) => {
  switch (action.type) {
    case '@@redux/INIT':
    case LOGIN_SUCCESS:
    case SIGNUP_SUCCESS:
      return {
        ...state,
        stateForLoggedIn: NavigationStack.router.getStateForAction(
          ActionForLoggedIn,
          stateForLoggedOut
        ),
      };

    case LOGOUT:
      return {
        stateForLoggedOut: NavigationStack.router.getStateForAction(
          NavigationActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({ routeName: 'signuplogin' })],
          })
        ),
      };

    default:
      return {
        ...state,
        stateForLoggedIn: NavigationStack.router.getStateForAction(
          action,
          state.stateForLoggedIn
        ),
      };
  }
};

export default navigationReducer;
