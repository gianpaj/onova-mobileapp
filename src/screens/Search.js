// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet } from 'react-native';
import { Body, Container, Left, Right } from 'native-base';
import { TabView, TabBar } from 'react-native-tab-view';

import { SearchByHashtagsTab } from './SearchByHashtagsTab';
import { SearchSellersTab } from './SearchSellersTab';
import { Header, Title } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';

import type { NavigationScreenProp } from 'react-navigation';

import type { Dispatch } from '../types';

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

class SearchContainer extends Component<Props, State> {
  state = {
    index: 0,
    routes: [{ key: 'tags', title: I18n.t('search.tags_tab') }, { key: 'sellers', title: I18n.t('search.shops_tab') }],
  };

  _handleIndexChange = index => this.setState({ index });

  _renderTabBar = props => (
    <TabBar indicatorStyle={styles.indicator} labelStyle={styles.label} style={styles.tabbar} {...props} />
  );

  _renderScene = ({ route }) => {
    switch (route.key) {
      case 'tags':
        return <SearchByHashtagsTab />;
      case 'sellers':
        return <SearchSellersTab />;
      default:
        return null;
    }
  };

  render() {
    return (
      <Container>
        <Header hasTabs>
          <Left style={styles.container} />
          <Body style={styles.container}>
            <Title>{I18n.t('search.header')}</Title>
          </Body>
          <Right />
        </Header>
        <TabView
          navigationState={this.state}
          renderScene={this._renderScene}
          renderTabBar={this._renderTabBar}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
          lazy
        />
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  tabbar: {
    backgroundColor: colors.bgDefault,
    elevation: 2,
  },
  label: {
    color: colors.black,
    fontWeight: '400',
  },
  indicator: {
    backgroundColor: colors.black,
  },
});

export const Search = connect()(SearchContainer);
