// @flow
// $FlowFixMe
import { NavigationActions } from 'react-navigation';

import AppNavigator from '../navigation/navigationStack';
import {
  LOGIN_SUCCESS,
  SIGNUP_SUCCESS,
  LOGOUT,
  SIGNUP,
  BACK,
} from '../actions/actionTypes';

const ActionForLoggedOut = AppNavigator.router.getActionForPathAndParams(
  'login'
);

const ActionForLoggedIn = NavigationActions.reset({
  index: 0,
  actions: [NavigationActions.navigate({ routeName: 'tabs' })],
});

const stateForLoggedOut = AppNavigator.router.getStateForAction(
  ActionForLoggedOut
);
const stateForLoggedIn = AppNavigator.router.getStateForAction(
  ActionForLoggedIn
);

const initialState = { stateForLoggedOut, stateForLoggedIn };

const navigationReducer = (state: any = initialState, action: Function) => {
  switch (action.type) {
    case '@@redux/INIT':
      return {
        ...state,
        stateForLoggedIn: AppNavigator.router.getStateForAction(
          ActionForLoggedIn,
          stateForLoggedOut
        ),
      };

    case LOGIN_SUCCESS:
    case SIGNUP_SUCCESS:
      return {
        ...state,
        stateForLoggedIn: AppNavigator.router.getStateForAction(
          ActionForLoggedIn,
          stateForLoggedOut
        ),
      };

    case LOGOUT:
      return {
        stateForLoggedOut: AppNavigator.router.getStateForAction(
          stateForLoggedOut
        ),
      };

    case SIGNUP:
      return {
        ...state,
        stateForLoggedOut: AppNavigator.router.getStateForAction(
          NavigationActions.navigate({
            routeName: 'signup',
          }),
          state.stateForLoggedOut
        ),
      };

    case BACK:
      return {
        ...state,
        stateForLoggedOut: AppNavigator.router.getStateForAction(
          NavigationActions.back()
        ),
      };

    default:
      return {
        ...state,
        stateForLoggedIn: AppNavigator.router.getStateForAction(
          action,
          state.stateForLoggedIn
        ),
      };
  }
};

export default navigationReducer;
