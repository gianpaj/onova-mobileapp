// @flow

import { combineReducers } from 'redux';

import CounterReducer from './counterReducer';
import NavigationReducer from './navigationReducer';
import LoginReducer from './loginReducer';

const reducers = {
  CounterReducer,
  NavigationReducer,
  LoginReducer,
};

export type Reducers = typeof reducers;

export default combineReducers(reducers);
