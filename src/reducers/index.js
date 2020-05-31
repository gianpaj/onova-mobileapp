// @flow

import { combineReducers } from 'redux';

import NavigationReducer from './navigationReducer';
import LoginReducer from './loginReducer';
import ChatReducer from './chatReducer';

const reducers = {
  NavigationReducer,
  LoginReducer,
  ChatReducer,
};

export default combineReducers(reducers);
