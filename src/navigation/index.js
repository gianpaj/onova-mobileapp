// @flow

import React from 'react';
import { ActivityIndicator, BackHandler, ImageBackground, StyleSheet, Platform } from 'react-native';
import { connect } from 'react-redux';
import { addNavigationHelpers, NavigationActions } from 'react-navigation';
import { initializeListeners, createReduxBoundAddListener } from 'react-navigation-redux-helpers';
import { Button } from 'react-native-elements';

import { checkLogin, logout, skip } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
import NavigationService from './NavigationService';

import type { Dispatch, ReduxState, UserData } from '../types';
import type { NavigationState } from '../types/navigationReducer';
import colors from '../config/colors';
import I18n from '../i18n';

import { addAuthBreadcrumb } from '../utils/analytics';
import SafeAreaView from '../SafeArea';

type Props = {
  checkedLoggedIn: boolean,
  dispatch: Dispatch,
  skippedLogin: boolean,
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
  state = {
    canReload: false,
  };

  componentDidMount() {
    initializeListeners('root', this.props.nav);

    // FIXME: horrible hack
    NavigationService.setDispatcher(this.props.dispatch);

    this.onCheckLogin();

    if (Platform.OS === 'ios') return;
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  onCheckLogin = () => {
    const { dispatch, isLoggedIn, userData, token } = this.props;

    // if (this.props.skippedLogin) return dispatch(skip());
    // for development - remove so you'll have to skip every time and stay as guest

    if (isLoggedIn && userData && token) {
      this.setState({ canReload: false });
      // checking again if user is still logged in
      dispatch(checkLogin(userData, token)).catch(e => {
        addAuthBreadcrumb({ data: e });
        console.debug(e);
        if (e.message === 'Invalid user') {
          addAuthBreadcrumb({ message: 'Invalid user' });
          dispatch(logout());
          return;
        }
        this.setState({ canReload: true });
      });
      return;
    }
    addAuthBreadcrumb({ message: 'not logged in' });
    dispatch(logout());
  };

  componentWillUnmount() {
    if (Platform.OS === 'ios') return;
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress = () => {
    this.props.dispatch(NavigationActions.back());
    return true;
  };

  _renderLoading = () => (
    <ImageBackground source={require('../assets/images/bg.png')} resizeMode="repeat" style={styles.container}>
      <ActivityIndicator size="large" color={colors.black} />
    </ImageBackground>
  );

  _renderRetry = () => (
    <ImageBackground source={require('../assets/images/bg.png')} resizeMode="repeat" style={styles.container}>
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
    const { dispatch, navigationState, isLoggedIn, skippedLogin, checkedLoggedIn } = this.props;

    if (this.state.canReload) return this._renderRetry();
    if ((isLoggedIn && !checkedLoggedIn) || (!isLoggedIn && skippedLogin)) return this._renderLoading();

    const state = isLoggedIn == true ? navigationState.stateForLoggedIn : navigationState.stateForLoggedOut;

    return (
      <SafeAreaView style={{ flex: 1 }} forceInset={{ bottom: 'never' }}>
        <NavigationStack
          navigation={addNavigationHelpers({
            dispatch,
            state,
            addListener,
          })}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  retryButtonContainer: {
    backgroundColor: colors.primary,
    minWidth: 160,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  checkedLoggedIn: state.LoginReducer.checkedLoggedIn,
  isLoggedIn: state.LoginReducer.isLoggedIn,
  skippedLogin: state.LoginReducer.skippedLogin,
  navigationState: state.NavigationReducer,
  token: state.LoginReducer.token,
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(AppNavigation);
