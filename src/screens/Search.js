// @flow

import React, { Component } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Body, Container, Header, Title } from 'native-base';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';

import { SearchProductsTab } from './SearchProductsTab';
import { SearchSellersTab } from './SearchSellersTab';

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
      labelStyle={styles.label}
      indicatorStyle={styles.indicator}
      style={styles.tabbar}
      {...props}
    />
  );

  _renderScene = SceneMap({
    tags: () => <SearchProductsTab navigation={this.props.navigation} />,
    sellers: () => <SearchSellersTab navigation={this.props.navigation} />,
  });

  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Title>Search</Title>
          </Body>
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
  tabbar: {
    backgroundColor: colors.white,
  },
  label: {
    color: colors.black,
    fontWeight: '400',
  },
  indicator: {
    backgroundColor: colors.pDark,
  },
});
