// @flow

import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import thunk from 'redux-thunk';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';

import NavigationReducer from './reducers/navigationReducer';
import loginReducer from './reducers/loginReducer';
import GenericReducer from './reducers/genericReducer';

import type { NavigationState } from './types/navigationReducer';
import type { LoginState } from './types/loginReducer';

const config1 = {
  key: 'primary',
  storage,
  blacklist: ['checkedLoggedIn'],
};

const reactNavigation = createReactNavigationReduxMiddleware(
  'root',
  (state: { LoginReducer: LoginState, NavigationReducer: NavigationState }) => {
    return state.LoginReducer.isLoggedIn == true
      ? state.NavigationReducer.stateForLoggedIn
      : state.NavigationReducer.stateForLoggedOut;
  }
);

// We are only persisting the loginReducer
const LoginReducer = persistReducer(config1, loginReducer);

// combineReducer applied on persisted(loginReducer) and NavigationReducer
const rootReducer = combineReducers({
  NavigationReducer,
  LoginReducer,
  GenericReducer,
});

if (__DEV__) {
  console.debug('__DEV__ mode on');
}

const middlewares = [thunk, reactNavigation /*, analytics */];

function configureStore() {
  // $FlowFixMe
  const store = createStore(
    rootReducer,
    __DEV__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__(),
    applyMiddleware(...middlewares)
  );
  const persistor = persistStore(store);
  // persistor.purge();
  return { persistor, store };
}

export default configureStore;
