// @flow
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import moxios from 'moxios';


import { login } from '../../src/actions/actionCreator';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const initialState = {};

describe('Login action', () => {
  const store = mockStore(initialState);

  beforeEach(() => {
    store.clearActions();
  });

  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('should NOT login', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 401,
        response: { ok: false },
      });
    });

    await store.dispatch(login({ emailAddress: 'a@as.com', password: '' }));
    expect(store.getActions()).toMatchSnapshot();
  });

  it('should login account with a verified account', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          token:
            'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjQ1ZGVjYTM2NzgxNjc4OWFiYTI5OWQiLCJhY2NvdW50U3RhdHVzIjoidmVyaWZpZWQiLCJlbWFpbEFkZHJlc3MiOiJnaWFucGErdGVzdEBnbWFpbC5jb20iLCJ1c2VybmFtZSI6ImZpcnN0cGVyc29uIiwiaWF0IjoxNTMxMzA1Njc1fQ.yxnijjnnctqqnFMnwj_AD-ViiZahYzar3aNRxxc-0-M',
          data: {
            _id: '5b45deca367816789aba299d',
            accountStatus: 'verified',
            emailAddress: 'user@gmail.com',
            username: 'firstperson',
          },
        },
      });
    });

    await store.dispatch(
      login({ emailAddress: 'user@gmail.com', password: 'val1d.P$ss' })
    );
    expect(store.getActions()).toMatchSnapshot();
  });

  it('should NOT login account without a verified account', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            _id: '5b45deca367816789aba299d',
            accountStatus: 'unverified',
            emailAddress: 'user@gmail.com',
            username: 'firstperson',
          },
        },
      });
    });

    try {
      await store.dispatch(
        login({ emailAddress: 'user@gmail.com', password: 'val1d.P$ss' })
      );
    } catch (err) {
      // console.log(err);
    }
    expect(store.getActions()).toMatchSnapshot();
  });
});
