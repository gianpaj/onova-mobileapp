// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View } from 'react-native';
import {
  Body,
  Button as NBButton,
  Content,
  Left,
  Right,
  Icon as NBIcon,
  Title,
} from 'native-base';

import { Header, ImageGridSearch } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import { category_radio_grp_1, category_radio_grp_2 } from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';
import type { ReduxState } from '../types';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  isLoading: boolean,
  terms?: any,
};

class SearchProductsResultsContainer extends Component<Props, State> {
  state = {
    isLoading: true,
  };

  componentDidMount() {
    const { params } = this.props.navigation.state;
    let terms;

    // for development
    if (!params) {
      // find shoes
      terms = { grp_1: 0, grp_2: -1, tag: '' };
    } else {
      terms = params;
    }
    this.setState({ terms });
  }

  getCategoryLabel = (num: number): string =>
    // $FlowFixMe
    category_radio_grp_1.find(g => g.value == num).label;

  getTypeLabel = (num: number): string =>
    // $FlowFixMe
    category_radio_grp_2.find(g => g.value == num).label;

  render() {
    const { terms } = this.state;
    if (!terms) return null;

    return (
      <View style={styles.flex1}>
        <Header>
          <Left style={styles.container}>
            <NBButton
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            {terms.tag && terms.grp_1 == -1 && terms.grp_2 == -1 ? (
              <Title style={{ color: colors.black }}>#{terms.tag}</Title>
            ) : // searching for category (clothes, shoes or other)
            terms.tag == '' && terms.grp_1 !== -1 && terms.grp_2 == -1 ? (
              <Title style={{ color: colors.black }}>
                {this.getCategoryLabel(terms.grp_1)}
              </Title>
            ) : // searching for type (men, women or other)
            terms.tag == '' && terms.grp_1 == -1 && terms.grp_2 !== -1 ? (
              <Title style={{ color: colors.black }}>
                {this.getTypeLabel(terms.grp_2)}
              </Title>
            ) : (
              // else, a combination
              <Title style={{ color: colors.black }}>
                {I18n.t('search.header')}
              </Title>
            )}
          </Body>
          <Right />
        </Header>
        <ImageGridSearch terms={terms} navigation={this.props.navigation} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const SearchProductsResults = connect(mapStateToProps)(
  SearchProductsResultsContainer
);
