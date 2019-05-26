// @flow

import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { Container } from 'native-base';
import I18n from 'react-native-i18n';
import { APP_NAME } from 'react-native-dotenv';

import { Title } from '../components';

import { SignUpTab } from './SignUpTab';
import { LoginTab } from './LoginTab';
import colors from '../config/colors';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type State = {
  index: number,
  routes: Array<any>,
};

class SignUpLoginContainer extends React.Component<{}, State> {
  state = {
    index: 0,
    routes: [
      { key: 'signup', title: I18n.t('sign_up_login_tabs.signup') },
      { key: 'login', title: I18n.t('sign_up_login_tabs.login') },
    ],
  };

  _handleIndexChange = index => this.setState({ index });

  _renderTabBar = props => (
    <TabBar indicatorStyle={styles.indicator} labelStyle={styles.label} style={styles.tabbar} {...props} />
  );

  _renderScene = SceneMap({
    signup: SignUpTab,
    login: LoginTab,
  });

  render() {
    return (
      <Container>
        <View style={styles.header}>
          {/* eslint-disable-next-line react-native/no-raw-text */}
          <Title>{APP_NAME.toUpperCase()}</Title>
        </View>
        <TabView
          navigationState={this.state}
          renderScene={this._renderScene}
          renderTabBar={this._renderTabBar}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
        />
      </Container>
    );
  }
}

export const SignUpLogin = SignUpLoginContainer;

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
