// @flow

import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import thunk from 'redux-thunk';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';

import NavigationReducer from './reducers/navigationReducer';
import LoginReducer from './reducers/loginReducer';
import RefresherReducer from './reducers/screenRefreshReducer';

import type { NavigationState } from './types/navigationReducer';
import type { LoginState } from './types/loginReducer';

const config1 = {
  key: 'primary',
  storage,
  blacklist: ['checkedLoggedIn', 'isVerifyAccountModalVisible', 'loading'],
};

const reactNavigation = createReactNavigationReduxMiddleware(
  'root',
  (state: { LoginReducer: LoginState, NavigationReducer: NavigationState }) => {
    return state.LoginReducer.isLoggedIn
      ? state.NavigationReducer.stateForLoggedIn
      : state.NavigationReducer.stateForLoggedOut;
  }
);

// We are only persisting the loginReducer
const LoginReducerPersisted = persistReducer(config1, LoginReducer);

const rootReducer = combineReducers({
  NavigationReducer,
  LoginReducer: LoginReducerPersisted,
  RefresherReducer,
});

if (__DEV__) {
  console.debug('__DEV__ mode');
}

const middlewares = [thunk, reactNavigation /*, analytics */];

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

function configureStore() {
  const store = createStore(rootReducer, composeEnhancers(applyMiddleware(...middlewares)));
  const persistor = persistStore(store);
  // persistor.purge();
  return { persistor, store };
}

export default configureStore;
