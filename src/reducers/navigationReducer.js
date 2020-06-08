// @flow
import { NavigationActions } from 'react-navigation';

import NavigationStack from '../navigation/navigationStack';
import {
  // INTRO,
  LOGIN_SUCCESS,
  LOGOUT,
  RELOAD_SUCCESS,
  SIGNUP_SUCCESS,
  SKIPPED,
} from '../actions/actionTypes';

import type { Action, NavigationState } from '../types/navigationReducer';

const ActionForLoggedOut = NavigationStack.router.getActionForPathAndParams('signuplogin');

const ActionForLoggedIn = NavigationActions.reset({
  index: 0,
  actions: [
    // for development on 'onova' Sendbird Instance
    // NavigationActions.navigate({
    //   routeName: 'chat',
    //   params: { channelUrl: 'sendbird_group_channel_203293808_364e94bc029b5b2008c4612548495cb613390d1a' },
    // }),
    // PROD
    NavigationActions.navigate({ routeName: 'tabs' }),
  ],
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
    case SKIPPED:
      return {
        ...state,
        stateForLoggedIn: NavigationStack.router.getStateForAction(ActionForLoggedIn, stateForLoggedOut),
      };

    case LOGOUT:
      return {
        stateForLoggedIn: null,
        stateForLoggedOut: NavigationStack.router.getStateForAction(
          NavigationActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({ routeName: 'signuplogin' })],
          })
        ),
      };

    // case INTRO:
    //   return {
    //     stateForLoggedOut: NavigationStack.router.getStateForAction(
    //       NavigationActions.navigate({ routeName: 'introScreens' })
    //     ),
    //   };

    default:
      return {
        ...state,
        stateForLoggedIn: NavigationStack.router.getStateForAction(action, state.stateForLoggedIn),
      };
  }
};

export default navigationReducer;
