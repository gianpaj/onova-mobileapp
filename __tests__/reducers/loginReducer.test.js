// @flow
import configureStore from 'redux-mock-store';

import {
  LOGIN_PENDING,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  SIGNUP_PENDING,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  LOGOUT,
  GETUSER_PENDING,
  GETUSER_SUCCESS,
  GETUSER_FAIL,
  RELOAD_SUCCESS,
  RELOAD_FAIL,
} from '../../src/actions/actionTypes';

import loginReducer from '../../src/reducers/loginReducer';

describe('Login reducer', () => {
  const mockStore = configureStore([]);
  const initialState = {};
  const store = mockStore(initialState);

  beforeEach(() => {
    store.clearActions();
  });

  it('should have an initial state', () => {
    expect(loginReducer(undefined, { type: '' })).toMatchSnapshot();
  });

  it('should have an login pending state', () => {
    expect(loginReducer(undefined, { type: LOGIN_PENDING })).toMatchSnapshot();
  });

  it('should have an login success state', () => {
    expect(
      loginReducer(undefined, {
        type: LOGIN_SUCCESS,
        payload: { token: 'myJWTAuthtoken', extraTestData: {} },
      })
    ).toMatchSnapshot();
  });

  it('should have an login fail state', () => {
    expect(loginReducer(undefined, { type: LOGIN_FAIL })).toMatchSnapshot();
  });

  it('should have an signup pending state', () => {
    expect(loginReducer(undefined, { type: SIGNUP_PENDING })).toMatchSnapshot();
  });

  it('should have an signup success state', () => {
    expect(
      loginReducer(undefined, {
        type: SIGNUP_SUCCESS,
        payload: { token: 'myJWTAuthtoken', extraTestData: {} },
      })
    ).toMatchSnapshot();
  });

  it('should have an signup fail state', () => {
    expect(loginReducer(undefined, { type: SIGNUP_FAIL })).toMatchSnapshot();
  });

  it('should have an logout state', () => {
    expect(loginReducer(undefined, { type: LOGOUT })).toMatchSnapshot();
  });

  it('should have an get user pending state', () => {
    expect(
      loginReducer(undefined, { type: GETUSER_PENDING })
    ).toMatchSnapshot();
  });

  it('should have an get user success state', () => {
    expect(
      loginReducer(undefined, {
        type: GETUSER_SUCCESS,
        payload: {
          token: 'TOKENDOESNOTRETURN',
          emailAddress: 'user@gmail.com',
        },
      })
    ).toMatchSnapshot();
  });

  it('should have an get user fail state', () => {
    expect(loginReducer(undefined, { type: GETUSER_FAIL })).toMatchSnapshot();
  });

  it('should have an reload success state', () => {
    expect(loginReducer(undefined, { type: RELOAD_SUCCESS })).toMatchSnapshot();
  });

  it('should have an reload fail state', () => {
    expect(loginReducer(undefined, { type: RELOAD_FAIL })).toMatchSnapshot();
  });
});
