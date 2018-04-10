// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  StyleSheet,
  FlatList,
  Platform,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { SearchBar } from 'react-native-elements';

import { Avatar } from '../components';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, Dispatch, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  data: Array<UserData>,
  hasError: boolean,
  isLoading: boolean,
  showingResults: boolean,
  text: string,
};

class SearchSellersTabContainer extends Component<Props, State> {
  state = {
    data: [],
    hasError: false,
    isLoading: false,
    showingResults: false,
    text: '',
  };

  onSearch = () => {
    if (!this.isSearchEnabled()) return;

    this.setState({ isLoading: true });

    const { token } = this.props.userData;
    api
      .get(`/api/users/?u=${this.state.text}`, { token })
      .then(data => {
        this.setState({ data });
      })
      .catch(err => {
        this.setState({ hasError: true });
        console.debug(err);
      })
      .then(() => {
        this.setState({ isLoading: false, showingResults: true });
      });
  };

  onChangeText = (text: string) => {
    if (text.trim().length == 0) this.clearResults();
    this.setState({ text: text.trim() });
  };

  isSearchEnabled(): boolean {
    return this.state.text.length > 2 && this.state.isLoading == false;
  }

  goToProfile = (user: UserData) => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'profile',
      params: user,
      key: `profile-${user.username}`,
    });
  };

  renderEmptyState = () => {
    if (!this.state.showingResults) return null;

    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.container}>
        <Text>
          {this.state.hasError ? 'Error searching' : 'No users found'}
        </Text>
      </View>
    );
  };

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  _renderItem = ({ item: user }: { item: UserData }) => {
    return (
      <TouchableHighlight
        underlayColor={colors.grey4}
        onPress={() => this.goToProfile(user)}>
        <View style={styles.itemContainer}>
          <Avatar
            size={'verySmall'}
            withBorder
            uri={user.profilePic}
            placeholderText={user.username}
          />
          <View style={[styles.flex1, styles.content]}>
            <View style={styles.contentHeader}>
              <Text style={styles.name}>
                {user.displayName || user.username}
              </Text>
            </View>
            <Text
              numberOfLines={1} // android
            >
              {user.username}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  };

  clearResults = () => this.setState({ data: [], showingResults: false });

  render() {
    const { isLoading } = this.state;

    return (
      <View style={styles.flex1}>
        <FlatList
          data={this.state.data}
          ItemSeparatorComponent={this._renderSeparator}
          ListHeaderComponent={
            <SearchBar
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={{
                backgroundColor: colors.transparent,
              }}
              onClearText={this.clearResults}
              clearButtonMode="while-editing" // iOS
              // enablesReturnKeyAutomatically // iOS
              icon={{ type: 'feather', name: 'at-sign' }}
              lightTheme
              maxLength={30}
              onChangeText={this.onChangeText}
              onSubmitEditing={this.onSearch}
              placeholder="username"
              showLoadingIcon={isLoading}
              inputStyle={{
                backgroundColor: colors.grey4,
                color: colors.black,
              }}
              returnKeyType="search"
              value={this.state.text}
            />
          }
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          renderItem={this._renderItem}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  itemContainer: {
    paddingLeft: 19,
    paddingRight: 16,
    paddingVertical: 12,
    flexDirection: 'row',
  },
  content: {
    marginLeft: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    color: colors.grey1,
    fontWeight: '800',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const SearchSellersTab = connect(mapStateToProps)(
  SearchSellersTabContainer
);
