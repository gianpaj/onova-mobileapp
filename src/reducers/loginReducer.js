import {
  LOGIN_PENDING,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  GOOGLE_LOGIN_PENDING,
  SIGNUP_PENDING,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  LOGOUT,
} from '../actions/actionTypes';

const initialState = {
  isLoggedIn: false,
  loading: false,
  loadingGoogleLogin: false,
  data: null,
  hasError: false,
  errorMsg: null,
};

const loginReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_PENDING:
    case SIGNUP_PENDING:
      return {
        ...state,
        isLoggedIn: false,
        loading: true,
        data: null,
        hasError: false,
        errorMsg: null,
      };

    case LOGIN_SUCCESS:
    case SIGNUP_SUCCESS:
      return {
        ...state,
        isLoggedIn: true,
        loading: false,
        data: action.payload,
      };

    case LOGIN_FAIL:
    case SIGNUP_FAIL:
      return {
        ...state,
        isLoggedIn: false,
        loading: false,
        loadingGoogleLogin: false,
        data: null,
        hasError: true,
        errorMsg: action.payload,
      };

    case GOOGLE_LOGIN_PENDING:
      return {
        ...state,
        isLoggedIn: false,
        loading: false,
        loadingGoogleLogin: true,
        data: null,
        hasError: false,
        errorMsg: null,
      };

    case LOGOUT:
      return {
        ...state,
        isLoggedIn: false,
        loadingGoogleLogin: false,
        data: null,
      };

    default:
      return state;
  }
};

export default loginReducer;
