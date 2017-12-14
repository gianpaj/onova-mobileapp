import { NavigationActions } from 'react-navigation';

import AppNavigator from '../navigation/navigationStack';
import { Login, Logout } from '../actions/actionTypes';

const ActionForLoggedOut = AppNavigator.router.getActionForPathAndParams(
  'login'
);
// const ActionForLoggedIn = AppNavigator.router.getActionForPathAndParams('tabs');

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

const navigationReducer = (state = initialState, action) => {
  switch (action.type) {
    case '@@redux/INIT':
      return {
        ...state,
        stateForLoggedIn: AppNavigator.router.getStateForAction(
          ActionForLoggedIn,
          stateForLoggedOut
        ),
      };

    case Login:
      return {
        ...state,
        stateForLoggedIn: AppNavigator.router.getStateForAction(
          ActionForLoggedIn,
          stateForLoggedOut
        ),
      };

    case Logout:
      return {
        ...state,
        stateForLoggedOut: AppNavigator.router.getStateForAction(
          NavigationActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({ routeName: 'login' })],
          })
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
