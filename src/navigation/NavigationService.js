import { NavigationActions } from 'react-navigation';

let _dispatch;

function setDispatcher(dispatch) {
  _dispatch = dispatch;
}

function navigate(routeName, params, key) {
  _dispatch(
    NavigationActions.navigate({
      type: NavigationActions.NAVIGATE,
      routeName,
      params,
      key: key ? key : null,
    })
  );
}

// add other navigation functions that you need and export them

export default {
  navigate,
  setDispatcher,
};
