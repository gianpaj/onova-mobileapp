// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet, View } from 'react-native';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';
import { Container, Title } from 'native-base';
import I18n from 'react-native-i18n';

import type { NavigationScreenProp } from 'react-navigation';

import type { Dispatch, ReduxState } from '../types';

import { SignUpTab } from './SignUpTab';
import { LoginTab } from './LoginTab';
import colors from '../config/colors';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
};

type State = {
  index: number,
  routes: Array<any>,
};

class SignUpLoginContainer extends React.Component<Props, State> {
  state = {
    index: 0,
    routes: [
      { key: 'signup', title: I18n.t('sign_up_login_tabs.signup') },
      { key: 'login', title: I18n.t('sign_up_login_tabs.login') },
    ],
  };

  _handleIndexChange = index => this.setState({ index });

  _renderHeader = props => (
    <TabBar
      indicatorStyle={styles.indicator}
      labelStyle={styles.label}
      style={styles.tabbar}
      {...props}
    />
  );

  _renderScene = SceneMap({
    signup: SignUpTab,
    login: LoginTab,
  });

  render() {
    return (
      <Container>
        <View style={styles.header}>
          {/* <Icon name="flash" style={{ fontSize: 104 }} /> */}
          <Title style={{ color: colors.black }}>ONOVA</Title>
        </View>
        <TabViewAnimated
          navigationState={this.state}
          renderScene={this._renderScene}
          renderHeader={this._renderHeader}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
          useNativeDriver
        />
      </Container>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  loading: state.LoginReducer.loading,
});

export const SignUpLogin = connect(mapStateToProps)(SignUpLoginContainer);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    margin: 40,
  },
  tabbar: {
    backgroundColor: colors.bgDefault,
  },
  label: {
    color: colors.black,
    fontWeight: '400',
  },
  indicator: {
    backgroundColor: colors.black,
  },
});
