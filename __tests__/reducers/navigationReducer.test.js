// @flow

import { LOGIN_SUCCESS, LOGOUT, RELOAD_SUCCESS, SIGNUP_SUCCESS } from '../../src/actions/actionTypes';

import navigationReducer from '../../src/reducers/navigationReducer';

describe('Navigation reducer', () => {
  it('should have an initial state', () => {
    const { stateForLoggedOut } = navigationReducer(undefined, { type: '' });
    const [{ key, ...route }] = stateForLoggedOut.routes;
    expect({
      stateForLoggedOut: {
        ...stateForLoggedOut,
        routes: [route],
      },
    }).toMatchSnapshot();
  });

  it('should have an initial state', () => {
    const { stateForLoggedIn } = navigationReducer(undefined, { type: '' });
    const [{ key, ...route }] = stateForLoggedIn.routes;
    expect({
      stateForLoggedOut: {
        ...stateForLoggedIn,
        routes: [route],
      },
    }).toMatchSnapshot();
  });

  it('should have an login success state', () => {
    const { stateForLoggedIn } = navigationReducer(undefined, {
      type: LOGIN_SUCCESS,
    });
    const [{ key, ...route }] = stateForLoggedIn.routes;
    expect({
      stateForLoggedOut: {
        ...stateForLoggedIn,
        routes: [route],
      },
    }).toMatchSnapshot();
  });

  it('should have an signup success state', () => {
    const { stateForLoggedIn } = navigationReducer(undefined, {
      type: SIGNUP_SUCCESS,
    });
    const [{ key, ...route }] = stateForLoggedIn.routes;
    expect({
      stateForLoggedOut: {
        ...stateForLoggedIn,
        routes: [route],
      },
    }).toMatchSnapshot();
  });

  it('should have an logout state', () => {
    const { stateForLoggedOut } = navigationReducer(undefined, {
      type: LOGOUT,
    });
    const [{ key, ...route }] = stateForLoggedOut.routes;
    expect({
      stateForLoggedOut: {
        ...stateForLoggedOut,
        routes: [route],
      },
    }).toMatchSnapshot();
  });

  it('should have an refresh state', () => {
    const { stateForLoggedIn } = navigationReducer(undefined, {
      type: RELOAD_SUCCESS,
    });
    const [{ key, ...route }] = stateForLoggedIn.routes;
    expect({
      stateForLoggedOut: {
        ...stateForLoggedIn,
        routes: [route],
      },
    }).toMatchSnapshot();
  });

  // it('should NOT login with the incorrect credentials', () => {
  //   // expect(store.dispatch(login(initialData)))
  // });
});
