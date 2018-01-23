// @flow

import { combineReducers } from 'redux';

import NavigationReducer from './navigationReducer';
import LoginReducer from './loginReducer';

const reducers = {
  NavigationReducer,
  LoginReducer,
};

export type Reducers = typeof reducers;

export default combineReducers(reducers);
