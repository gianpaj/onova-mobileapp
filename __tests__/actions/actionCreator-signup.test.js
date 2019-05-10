// @flow
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import moxios from 'moxios';

import { signup } from '../../src/actions/actionCreator';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const initialState = {};

describe('Signup action', () => {
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

  it('should signup but not login', async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: {
            _id: '5b4617f306413c789acefa7d',
            accountStatus: 'notverified',
            emailAddress: 'user@gmail.com',
            followersCount: 0,
            followingCount: 0,
            ratingsTotal: 0,
            reviewsCount: 0,
            sharedCount: 0,
            tokens: [],
            username: 'firstperson',
            types: ['reseller'],
          },
          token:
            'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjQ2MTdmMzA2NDEzYzc4OWFjZWZhN2QiLCJhY2NvdW50U3RhdHVzIjoibm90dmVyaWZpZWQiLCJlbWFpbEFkZHJlc3MiOiJnaWFucGErdGVzdEBnbWFpbC5jb20iLCJmb2xsb3dlcnNDb3VudCI6MCwiZm9sbG93aW5nQ291bnQiOjAsInJhdGluZ3NUb3RhbCI6MCwicmV2aWV3c0NvdW50IjowLCJzaGFyZWRDb3VudCI6MCwidG9rZW5zIjpbXSwidXNlcm5hbWUiOiJmaXJzdHBlcnNvbiIsImlhdCI6MTUzMTMyMDMwN30.aOdpVtldfLKYeuqt_bIN-n4Ckhid860CCJmKlWHV7s8',
        },
      });
    });

    try {
      await store.dispatch(
        signup({
          username: 'firstperson',
          emailAddress: 'user@gmail.com',
          password: 'val1d.P$ss',
        })
      );
    } catch (error) {}
    expect(store.getActions()).toMatchSnapshot();
  });

  /*
  it('should NOT signup with a username with Cyrillic characters', async () => {
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
  });*/
});
