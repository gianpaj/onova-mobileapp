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
import { Button } from 'react-native-elements';

import { checkLogin, intro } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
import NavigationService from './NavigationService';

import type { Dispatch, ReduxState, UserData } from '../types';
import type { NavigationState } from '../types/navigationReducer';
import colors from '../config/colors';
import I18n from '../i18n';

import { addAuthBreadcrumb } from '../utils/analytics';

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

class AppNavigation extends React.PureComponent<Props, *> {
  notificationListener;

  state = {
    canReload: false,
  };

  componentDidMount() {
    initializeListeners('root', this.props.nav);

    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);

    // FIXME: horrible hack
    NavigationService.setDispatcher(this.props.dispatch);

    this.onCheckLogin();
  }

  onCheckLogin = () => {
    const { dispatch, isLoggedIn, userData, token } = this.props;

    if (isLoggedIn && userData && token) {
      this.setState({ canReload: false });
      // checking again if user is still logged in
      dispatch(checkLogin(userData, token)).catch(e => {
        if (e.message === 'Invalid user') {
          dispatch(intro());
        } else {
          this.setState({ canReload: true });
        }
        addAuthBreadcrumb({ data: e });
        console.debug(e);
      });
    } else {
      addAuthBreadcrumb({ message: 'not logged in' });
      dispatch(intro());
    }
  };

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

  _renderRetry = () => (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      resizeMode="repeat"
      style={styles.container}>
      {/* TODO: add a cloud icon with stricking line */}
      {/* You're not connected to the Internet */}
      <Button
        buttonStyle={styles.retryButtonContainer}
        onPress={this.onCheckLogin}
        textStyle={styles.retryButtonText}
        title={I18n.t('login.retry')}
      />
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

    if (this.state.canReload) return this._renderRetry();
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
  },
  retryButtonContainer: {
    backgroundColor: colors.primary,
    minWidth: 160,
  },
  retryButtonText: {
    fontSize: 16,
    color: colors.white,
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
