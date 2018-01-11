import {
  LOGIN_PENDING,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  GOOGLE_LOGIN_PENDING,
  SIGNUP_PENDING,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  LOGOUT,
  GETUSER_PENDING,
  GETUSER_SUCCESS,
  GETUSER_FAIL,
} from '../actions/actionTypes';

const initialState = {
  isLoggedIn: false,
  loading: false,
  loadingGoogleLogin: false,
  data: null,
  hasError: false,
  errorMsg: null,
  fetchLoading: false,
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

    case GETUSER_PENDING:
      return {
        ...state,
        fetchLoading: true,
      };

    case GETUSER_SUCCESS:
      return {
        ...state,
        fetchLoading: false,
        hasError: false,
        data: { ...state.data, ...action.payload },
      };

    case GETUSER_FAIL:
      return {
        ...state,
        fetchLoading: false,
        hasError: true,
        errorMsg: action.payload,
      };

    default:
      return state;
  }
};

export default loginReducer;
