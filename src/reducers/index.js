// @flow

import { combineReducers } from 'redux';

import NavigationReducer from './navigationReducer';
import LoginReducer from './loginReducer';

const reducers = {
  NavigationReducer,
  LoginReducer,
};

export default combineReducers(reducers);
