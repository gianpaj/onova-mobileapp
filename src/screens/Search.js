// @flow

import React, { Component } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Body, Container, Title, Left, Right } from 'native-base';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';

import { SearchWithHasthagsTab } from './SearchWithHasthagsTab';
import { SearchSellersTab } from './SearchSellersTab';
import { Header } from '../components';

import colors from '../config/colors';

import type { NavigationScreenProp } from 'react-navigation';

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

export class Search extends Component<Props, State> {
  state = {
    index: 0,
    routes: [
      { key: 'tags', title: '#Tags' },
      { key: 'sellers', title: '@Shops' },
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
    tags: SearchWithHasthagsTab,
    sellers: SearchSellersTab,
  });

  render() {
    return (
      <Container style={{ backgroundColor: colors.white }}>
        <Header style={{ backgroundColor: colors.bgDefault }} hasTabs>
          <Left style={styles.container} />
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>Search</Title>
          </Body>
          <Right />
        </Header>
        <TabViewAnimated
          navigationState={this.state}
          renderScene={this._renderScene}
          renderHeader={this._renderHeader}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
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
  },
  label: {
    color: colors.black,
    fontWeight: '400',
  },
  indicator: {
    backgroundColor: colors.black,
  },
});
