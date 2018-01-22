import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import thunk from 'redux-thunk';

import NavigationReducer from './reducers/navigationReducer';
import loginReducer from './reducers/loginReducer';

const config1 = {
  key: 'primary',
  storage,
  // blacklist: ['counterString'],
};

// We are only persisting the counterReducer and loginReducer
const LoginReducer = persistReducer(config1, loginReducer);

// combineReducer applied on persisted(counterReducer) and NavigationReducer
const rootReducer = combineReducers({
  NavigationReducer,
  LoginReducer,
});

if (__DEV__) {
  console.warn('dev mode');
}

function configureStore() {
  const store = createStore(
    rootReducer,
    __DEV__
      ? window.__REDUX_DEVTOOLS_EXTENSION__ &&
        window.__REDUX_DEVTOOLS_EXTENSION__()
      : undefined,
    applyMiddleware(
      thunk
      // analytics,
    )
  );
  const persistor = persistStore(store);
  // persistor.purge();
  return { persistor, store };
}

export default configureStore;
