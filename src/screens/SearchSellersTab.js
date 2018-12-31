// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { SearchBar, Icon } from 'react-native-elements';
import { withNavigation } from 'react-navigation';

import { Avatar } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import * as api from '../utils/api';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, ReduxState } from '../types';

type Props = {
  focused: boolean,
  navigation: NavigationScreenProp<*>,
  token: string,
};

type State = {
  data: Array<UserData>,
  hasError: boolean,
  isLoading: boolean,
  showingResults: boolean,
  text: string,
};

class SearchSellersTabContainer extends Component<Props, State> {
  search;
  constructor(props: Props) {
    super(props);
    this.search = React.createRef();
  }

  componentDidUpdate() {
    this.props.focused && this.search.current.focus();
  }

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

    // $FlowFixMe
    this.search.current.blur();

    const { token } = this.props;
    api
      .get(`/api/users/?u=${this.state.text}`, { token })
      .then(data => this.setState({ data }))
      .catch(err => {
        this.setState({ hasError: true });
        console.debug(err);
      })
      .then(() => this.setState({ isLoading: false, showingResults: true }));
  };

  onChangeText = (text: string) => {
    if (text.trim().length == 0) this.clearResults();
    this.setState({ text: text.trim() });
  };

  isSearchEnabled = (): boolean =>
    this.state.text.length > 2 && this.state.isLoading == false;

  goToProfile = (user: UserData) => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'profileInStack',
      params: user,
      key: `profile-${user.username}`,
    });
  };

  renderEmptyState = () =>
    this.state.showingResults && (
      <View style={styles.container}>
        <Text>
          {this.state.hasError
            ? I18n.t('search.error')
            : I18n.t('search.empty_state_message')}
        </Text>
      </View>
    );

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  // eslint-disable-next-line react/no-unused-prop-types
  _renderItem = ({ item: user }: { item: UserData }) => (
    <TouchableHighlight
      underlayColor={colors.grey4}
      onPress={() => this.goToProfile(user)}>
      <View style={styles.itemContainer}>
        <Avatar
          size={'verySmall'}
          uri={user.profilePic}
          placeholderText={user.username}
        />
        <View style={[styles.flex1, styles.content]}>
          <View style={styles.contentHeader}>
            <Text style={styles.name}>{user.username}</Text>
          </View>
          <Text numberOfLines={1}>{user.username}</Text>
        </View>
        <Icon size={28} name="chevron-right" color={colors.grey4} />
      </View>
    </TouchableHighlight>
  );

  clearResults = () => this.setState({ data: [], showingResults: false });

  render() {
    const { isLoading } = this.state;

    return (
      <FlatList
        data={this.state.data}
        ItemSeparatorComponent={this._renderSeparator}
        ListHeaderComponent={
          <View
            style={{
              alignSelf: 'center',
              marginVertical: 30,
              width: 280,
            }}>
            <SearchBar
              ref={this.search}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={this.props.focused}
              blurOnSubmit={false}
              clearButtonMode="while-editing" // iOS
              containerStyle={{
                backgroundColor: colors.white,
                borderTopWidth: 0,
                borderBottomWidth: 0,
              }}
              // enablesReturnKeyAutomatically // iOS
              icon={{ type: 'feather', name: 'at-sign', color: colors.grey1 }}
              inputStyle={{
                backgroundColor: colors.white,
                color:
                  this.isSearchEnabled() || isLoading
                    ? colors.black
                    : colors.red,
              }}
              lightTheme
              maxLength={30}
              onChangeText={this.onChangeText}
              onClearText={this.clearResults}
              onSubmitEditing={this.onSearch}
              placeholder={I18n.t('search.username_placeholder')}
              placeholderTextColor={colors.grey1}
              returnKeyType="search"
              showLoadingIcon={isLoading}
              underlineColorAndroid={colors.black}
              value={this.state.text}
            />
          </View>
        }
        keyExtractor={this._keyExtractor}
        ListEmptyComponent={this.renderEmptyState}
        renderItem={this._renderItem}
      />
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
  token: state.LoginReducer.token,
});

export const SearchSellersTab = withNavigation(
  connect(mapStateToProps)(SearchSellersTabContainer)
);
