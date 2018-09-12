// @flow

import React from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import { addNavigationHelpers, NavigationActions } from 'react-navigation';
import {
  initializeListeners,
  createReduxBoundAddListener,
} from 'react-navigation-redux-helpers';

import { checkLogin, intro } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
import NavigationService from './NavigationService';

import type { Dispatch, ReduxState, UserData } from '../types';
import type { NavigationState } from '../types/navigationReducer';
import colors from '../config/colors';

type Props = {
  checkedLoggedIn: boolean,
  dispatch: Dispatch,
  isLoggedIn: boolean,
  navigationState: NavigationState,
  userData?: UserData,
  token?: string,
  nav: Object,
};

// on Android, the URI prefix typically contains a host in addition to scheme
// const prefix = Platform.OS == 'android' ? 'onova://onova/' : 'onova://';

const addListener = createReduxBoundAddListener('root');

class AppNavigation extends React.PureComponent<Props> {
  notificationListener;

  componentDidMount() {
    initializeListeners('root', this.props.nav);

    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    const { isLoggedIn, userData, token, dispatch } = this.props;

    // FIXME: horrible hack
    NavigationService.setDispatcher(dispatch);

    if (isLoggedIn && userData && token) {
      // checking again if user is still logged in
      dispatch(checkLogin(userData, token)).catch(e => {
        // if (e.message == 'Invalid user') {
        // }
        dispatch(intro());
        console.warn(e);
      });
    } else {
      dispatch(intro());
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    this.notificationListener && this.notificationListener.remove();
  }

  onBackPress = () => {
    this.props.dispatch(NavigationActions.back());
    return true;
  };

  _renderLoading = () => (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      resizeMode="repeat"
      style={styles.container}>
      <ActivityIndicator size="large" color={colors.black} />
    </ImageBackground>
  );

  render() {
    const {
      dispatch,
      navigationState,
      isLoggedIn,
      checkedLoggedIn,
    } = this.props;
    const state =
      isLoggedIn == true
        ? navigationState.stateForLoggedIn
        : navigationState.stateForLoggedOut;

    if (isLoggedIn && !checkedLoggedIn) return this._renderLoading();

    return (
      <NavigationStack
        navigation={addNavigationHelpers({
          dispatch,
          state,
          addListener,
        })}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  checkedLoggedIn: state.LoginReducer.checkedLoggedIn,
  isLoggedIn: state.LoginReducer.isLoggedIn,
  navigationState: state.NavigationReducer,
  token: state.LoginReducer.token,
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(AppNavigation);
