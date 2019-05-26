// @flow
import { NavigationActions } from 'react-navigation';

import NavigationStack from '../navigation/navigationStack';
import { INTRO, LOGIN_SUCCESS, LOGOUT, RELOAD_SUCCESS, SIGNUP_SUCCESS } from '../actions/actionTypes';

import type { Action, NavigationState } from '../types/navigationReducer';

const ActionForLoggedOut = NavigationStack.router.getActionForPathAndParams('introScreens');

const ActionForLoggedIn = NavigationActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'tabs' })],
});

const stateForLoggedOut = NavigationStack.router.getStateForAction(ActionForLoggedOut);
const stateForLoggedIn = NavigationStack.router.getStateForAction(ActionForLoggedIn);

const initialState = { stateForLoggedOut, stateForLoggedIn };

const navigationReducer = (state: NavigationState = initialState, action: Action): NavigationState => {
  switch (action.type) {
    case '@@redux/INIT':
    case RELOAD_SUCCESS:
    case LOGIN_SUCCESS:
    case SIGNUP_SUCCESS:
      return {
        ...state,
        stateForLoggedIn: NavigationStack.router.getStateForAction(ActionForLoggedIn, stateForLoggedOut),
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

    case INTRO:
      return {
        stateForLoggedOut: NavigationStack.router.getStateForAction(
          NavigationActions.navigate({ routeName: 'introScreens' })
        ),
      };

    default:
      return {
        ...state,
        stateForLoggedIn: NavigationStack.router.getStateForAction(action, state.stateForLoggedIn),
      };
  }
};

export default navigationReducer;
