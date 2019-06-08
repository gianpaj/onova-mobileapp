// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet } from 'react-native';
import { Body, Container, Right, Left, Button, Icon } from 'native-base';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

import { ReviewsTab } from './ReviewsTab';
import { Header, Title } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';

import type { Dispatch } from '../types';
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

class ReviewsContainer extends Component<Props, State> {
  state = {
    index: 0,
    routes: [
      { key: 'sold', title: I18n.t('reviews.sold_tab') },
      { key: 'purchased', title: I18n.t('reviews.purchased_tab') },
    ],
  };

  _handleIndexChange = index => this.setState({ index });

  _renderTabBar = props => (
    <TabBar indicatorStyle={styles.indicator} labelStyle={styles.label} style={styles.tabbar} {...props} />
  );

  _renderScene = SceneMap({
    sold: () => <ReviewsTab as="seller" />,
    purchased: () => <ReviewsTab as="buyer" />,
  });

  render() {
    return (
      <Container>
        <Header hasTabs>
          <Left style={styles.container}>
            <Button transparent dark onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body style={styles.container}>
            <Title>{I18n.t('reviews.header')}</Title>
          </Body>
          <Right />
        </Header>
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

export const Reviews = connect()(ReviewsContainer);

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  indicator: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.black,
    fontWeight: '400',
  },
  tabbar: {
    backgroundColor: colors.white,
  },
});
