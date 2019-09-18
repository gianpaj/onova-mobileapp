// @flow

import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Button as NBButton, Left, Right } from 'native-base';

import { Header, Icon, ImageGridSearch, Title } from '../components';
import { category_radio_grp_1, category_radio_grp_2, category_radio_grp_3 } from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';

const categories = [...category_radio_grp_1, ...category_radio_grp_2, ...category_radio_grp_3];

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  terms: {
    grp_1: number,
    tag: String,
  },
};

export class SearchProductsResults extends Component<Props, State> {
  state = {
    terms: null,
  };

  componentDidMount() {
    const { params } = this.props.navigation.state;
    let terms;

    // for development
    if (!params) {
      // find clothes
      terms = { grp_1: 0, tag: '' };
    } else {
      terms = params;
    }
    this.setState({ terms });
  }

  getCategoryLabel = (num: number): string =>
    // $FlowFixMe
    categories.find(g => g.value == num).label;

  render() {
    const { terms } = this.state;
    if (!terms) return null;

    return (
      <View style={styles.flex1}>
        <Header>
          <Left style={styles.container}>
            <NBButton transparent onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            {terms.tag && terms.grp_1 == -1 && terms.grp_2 == -1 ? (
              // eslint-disable-next-line react-native/no-raw-text
              <Title>#{terms.tag}</Title>
            ) : (
              // searching for category (clothes, shoes or other)
              terms.tag == '' && terms.grp_1 !== -1 && <Title>{this.getCategoryLabel(terms.grp_1)}</Title>
            )}
          </Body>
          <Right />
        </Header>
        <ImageGridSearch terms={terms} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
});
