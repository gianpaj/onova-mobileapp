// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert, Dimensions, StyleSheet } from 'react-native';
import { Body, Container, Title, Right, Left, Button, Icon } from 'native-base';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { ReviewsTab } from './ReviewsTab';
import { Header } from '../components';

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

  onInfoIcon() {
    Alert.alert(
      'Want more reviews?',
      'To transfer your reviews from VK, Instagram, Facebook or other places, contact us at support@onova.co'
    );
  }

  render() {
    return (
      <Container>
        <Header hasTabs>
          <Left style={styles.container}>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>Reviews</Title>
          </Body>
          <Right>
            <Button
              transparent
              dark
              style={{ marginLeft: 10 }}
              onPress={this.onInfoIcon}>
              <MaterialCommunityIcons name="information-outline" size={28} />
            </Button>
          </Right>
        </Header>
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

export const Reviews = connect()(ReviewsContainer);

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  tabbar: {
    backgroundColor: colors.white,
  },
  label: {
    color: colors.black,
    fontWeight: '400',
  },
  indicator: {
    backgroundColor: colors.primary,
  },
});
