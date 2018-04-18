// @flow

import React, { Component } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Body,
  Container,
  Header,
  Title,
  Right,
  Left,
  Button,
  Icon,
} from 'native-base';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';

import { ReviewsTab } from './ReviewsTab';

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

export class Reviews extends Component<Props, State> {
  state = {
    index: 0,
    routes: [
      { key: 'sold', title: 'Sold' },
      { key: 'purchased', title: 'Purchased' },
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
    sold: () => <ReviewsTab as="seller" />,
    purchased: () => <ReviewsTab as="buyer" />,
  });

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body>
            <Title>Reviews</Title>
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
