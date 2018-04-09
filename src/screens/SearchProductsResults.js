// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View } from 'react-native';
import {
  Body,
  Button as NBButton,
  Content,
  Header,
  Left,
  Right,
  Icon as NBIcon,
  Title,
} from 'native-base';

import { ImageGridSearch } from '../components/index';

import colors from '../config/colors';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, Dispatch, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  isLoading: boolean,
  terms?: any,
};

class SearchProductsResultsContainer extends Component<Props, State> {
  state = {
    isLoading: true,
  };

  componentWillMount() {
    const { params } = this.props.navigation.state;
    let terms = {};

    // for development
    if (!params) {
      terms.tag = 'boots';
    } else {
      terms = params;
    }
    console.debug('terms:', terms);
    this.setState({ terms });
  }

  render() {
    if (!this.state.terms) return null;
    const { terms } = this.state;

    return (
      <View style={styles.flex1}>
        <Header>
          <Left>
            <NBButton
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body>
            {terms.tag && terms.grp_1 == -1 && terms.grp_2 == -1 ? (
              <Title>#{terms.tag}</Title>
            ) : (
              <Title>Results</Title>
            )}
          </Body>
          <Right />
        </Header>
        <Content style={{ backgroundColor: colors.white }}>
          <ImageGridSearch terms={terms} navigation={this.props.navigation} />
        </Content>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const SearchProductsResults = connect(mapStateToProps)(
  SearchProductsResultsContainer
);
