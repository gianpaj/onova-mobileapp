// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet } from 'react-native';
import { Body, Container, Title, Left, Right } from 'native-base';
import { TabView, TabBar } from 'react-native-tab-view';

import { SearchWithHasthagsTab } from './SearchWithHasthagsTab';
import { SearchSellersTab } from './SearchSellersTab';
import { Header } from '../components';

import I18n from '../i18n';
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

class SearchContainer extends Component<Props, State> {
  state = {
    index: 0,
    routes: [
      { key: 'tags', title: I18n.t('search.tags_tab') },
      { key: 'sellers', title: I18n.t('search.shops_tab') },
    ],
  };

  _handleIndexChange = index => this.setState({ index });

  _renderTabBar = props => (
    <TabBar
      indicatorStyle={styles.indicator}
      labelStyle={styles.label}
      style={styles.tabbar}
      {...props}
    />
  );

  _renderScene = ({ route, navigationState: { index } }) => {
    switch (route.key) {
      case 'tags':
        return <SearchWithHasthagsTab focused={index === 0} />;
      case 'sellers':
        return <SearchSellersTab focused={index === 1} />;
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
            <Title style={{ color: colors.black }}>
              {I18n.t('search.header')}
            </Title>
          </Body>
          <Right />
        </Header>
        <TabView
          navigationState={this.state}
          renderScene={this._renderScene}
          renderTabBar={this._renderTabBar}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
          useNativeDriver
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
