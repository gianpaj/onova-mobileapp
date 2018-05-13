// @flow

import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import thunk from 'redux-thunk';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';

import NavigationReducer from './reducers/navigationReducer';
import loginReducer from './reducers/loginReducer';

const config1 = {
  key: 'primary',
  storage,
  blacklist: ['checkedLoggedIn'],
};

const reactNavigation = createReactNavigationReduxMiddleware('root', state => {
  return state.LoginReducer.isLoggedIn == true
    ? state.NavigationReducer.stateForLoggedIn
    : state.NavigationReducer.stateForLoggedOut;
});

// We are only persisting the loginReducer
const LoginReducer = persistReducer(config1, loginReducer);

// combineReducer applied on persisted(loginReducer) and NavigationReducer
const rootReducer = combineReducers({
  NavigationReducer,
  LoginReducer,
});

if (__DEV__) {
  console.warn('dev mode');
}

function configureStore() {
  // $FlowFixMe
  const store = createStore(
    rootReducer,
    __DEV__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__(),
    applyMiddleware(
      thunk,
      reactNavigation
      // analytics,
    )
  );
  const persistor = persistStore(store, {}, () => {
    // console.warn('rehydrationComplete');
    // store.dispatch(reloadUserAndInitialize());
  });
  // persistor.purge();
  return { persistor, store };
}

export default configureStore;
