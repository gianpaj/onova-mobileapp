// @flow
import { NavigationActions } from 'react-navigation';

import NavigationStack from '../navigation/navigationStack';
import {
  LOGIN_SUCCESS,
  SIGNUP_SUCCESS,
  LOGOUT,
  SIGNUP,
  BACK,
} from '../actions/actionTypes';
import type { Action } from '../types/navigationReducer';

const ActionForLoggedOut = NavigationStack.router.getActionForPathAndParams(
  'login'
);

const ActionForLoggedIn = NavigationActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'tabs' })],
});

const stateForLoggedOut = NavigationStack.router.getStateForAction(
  // $FlowFixMe
  ActionForLoggedOut
);
const stateForLoggedIn = NavigationStack.router.getStateForAction(
  ActionForLoggedIn
);

const initialState = { stateForLoggedOut, stateForLoggedIn };

const navigationReducer = (state: any = initialState, action: Action) => {
  switch (action.type) {
    case '@@redux/INIT':
      return {
        ...state,
        stateForLoggedIn: NavigationStack.router.getStateForAction(
          ActionForLoggedIn,
          stateForLoggedOut
        ),
      };

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
          stateForLoggedOut
        ),
      };

    case SIGNUP:
      return {
        ...state,
        stateForLoggedOut: NavigationStack.router.getStateForAction(
          NavigationActions.navigate({
            routeName: 'signup',
            key: 'signup',
          }),
          state.stateForLoggedOut
        ),
      };

    case BACK:
      return {
        ...state,
        stateForLoggedOut: NavigationStack.router.getStateForAction(
          NavigationActions.back()
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
