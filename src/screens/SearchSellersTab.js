// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  StyleSheet,
  Platform,
  Text,
  View,
} from 'react-native';
import {
  Button as NBButton,
  Content,
  Icon as NBIcon,
  Input,
  Item,
} from 'native-base';

import type { NavigationScreenProp } from 'react-navigation';

import colors from '../config/colors';
import * as api from '../utils/api';

import type { UserData, Dispatch, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  isLoading: boolean,
  text: string,
};

class SearchSellersTabContainer extends Component<Props, State> {
  state = {
    isLoading: false,
    text: '',
  };

  onSearch = () => {
    if (this.state.text.length !== 0) {
      console.warn(this.state.text);
    }
  };

  onChangeText = (text: string) => {
    this.setState({ text });
  };

  isSearchEnabled() {
    return this.state.text.length == 0;
  }

  render() {
    const { text } = this.state;

    return (
      <View style={styles.flex1}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
          <Item style={{ flex: 1 }}>
            <NBIcon active name="ios-search" />
            <Input
              // autoFocus
              onChangeText={this.onChangeText}
              onSubmitEditing={this.onSearch}
              maxLength={50}
              clearButtonMode="while-editing" // iOS
              returnKeyType="search"
              // enablesReturnKeyAutomatically // iOS
            />
          </Item>
          <NBButton
            disabled={this.isSearchEnabled()}
            transparent
            onPress={this.onSearch}>
            <Text
              style={{
                color: this.isSearchEnabled() ? colors.grey4 : colors.black,
              }}>
              Search
            </Text>
          </NBButton>
        </View>
        <Content style={{ backgroundColor: colors.white }}>
          <View style={styles.padder}>
            <Text>asd</Text>
          </View>
        </Content>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  padder: {
    padding: 10,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const SearchSellersTab = connect(mapStateToProps)(
  SearchSellersTabContainer
);
