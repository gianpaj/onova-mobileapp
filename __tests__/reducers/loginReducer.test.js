// @flow
import configureStore from 'redux-mock-store';

import { login } from '../../src/actions/actionCreator';
import loginReducer from '../../src/reducers/loginReducer';

describe('Login actions', () => {
  const mockStore = configureStore([]);
  const initialState = {};
  const store = mockStore(initialState);

  beforeEach(() => {
    store.clearActions();
  });

  it('should have an initial state', () => {
    expect(loginReducer(undefined, {})).toMatchSnapshot();
  });

  it('should NOT login with the incorrect credentials', () => {
    // expect(store.dispatch(login(initialData)))
    console.log(loginReducer(undefined, {}));
  });
});
