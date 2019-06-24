// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Body, Button, Container, Icon, Left, Right } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { withNavigation } from 'react-navigation';

import I18n from '../i18n';
import colors from '../config/colors';
import * as api from '../utils/api';
// import * as ui from '../utils/ui';
import { Avatar, Header, Title } from '../components';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, ReduxState } from '../types';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  // userData: UserData,
  token: string,
};

type State = {
  data: Array<UserData>,
  isLoading: boolean,
  isRefreshing: boolean,
  itemHeight: number,
};

export class SuggestionsContainer extends Component<Props, State> {
  state = {
    data: [],
    isLoading: true,
    isRefreshing: false,
    itemHeight: -1,
  };

  async componentDidMount() {
    const { token } = this.props;
    try {
      const { data } = await api.getSuggestions(token);
      this.setState({ data });
    } catch (err) {
      console.error(err);
    }
    this.setState({ isLoading: false });
  }

  goToProfile = (user: UserData) => {
    let routeName = 'profileInStack';

    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
  };

  async onFollowOrUnfollow(_id: string, amIAFollower: boolean) {
    const { token } = this.props;
    const followOrUnfollow = amIAFollower ? 'unfollow' : 'follow';
    try {
      await api.post(`/api/users/${_id}/${followOrUnfollow}`, {}, { token });
      console.debug(followOrUnfollow, _id);
      // this.setState({ isFollowing: followOrUnfollow == 'follow' });
      this.refreshSuggestions();
    } catch (err) {
      console.error(err);
    }
  }

  _renderItem = ({ item }) => {
    const user: UserData = item._id;

    return (
      <TouchableHighlight
        style={{ width: initialLayout.width / 3 }}
        underlayColor={colors.grey4}
        onPress={() => this.goToProfile(user)}>
        <View style={{ alignItems: 'center' }}>
          <Avatar
            size={'medium'}
            withButton
            uri={user.profilePic || ''}
            placeholderText={user.username}
            buttonActiveState={user.amIAFollower}
            onButtonPress={() => this.onFollowOrUnfollow(user._id, user.amIAFollower)}
            onPress={() => this.goToProfile(user)}
          />
          <Text style={styles.username} numberOfLines={1}>
            @{user.username}
          </Text>
          {/* <Text style={styles.numOfConns} numberOfLines={1}>
            ({item.numOfConns})
          </Text> */}
        </View>
      </TouchableHighlight>
    );
  };

  _keyExtractor = (item: string) => item._id._id;

  renderEmptyState = (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        size={48}
        name={'account-multiple-plus'}
        color={colors.grey2}
        style={{ alignSelf: 'center', marginBottom: 30 }}
      />
      <Text style={styles.boldText}>{I18n.t('suggestions.empty_state_message_title')}</Text>
      <Text>{I18n.t('suggestions.empty_state_message_body')}</Text>
    </View>
  );

  refreshSuggestions = async () => {
    const { token } = this.props;
    this.setState({ isRefreshing: true });
    try {
      const { data } = await api.getSuggestions(token);
      this.setState({ data });
    } catch (err) {
      console.error(err);
    }
    this.setState({ isRefreshing: false });
  };

  renderLoading = (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );

  render() {
    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <Button transparent dark onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body style={[styles.container, { flex: 3 }]}>
            <Title>{I18n.t('suggestions.header')}</Title>
          </Body>
          <Right />
        </Header>
        {this.state.isLoading ? (
          this.renderLoading
        ) : (
          <FlatList
            data={this.state.data}
            keyExtractor={this._keyExtractor}
            ListEmptyComponent={this.renderEmptyState}
            renderItem={this._renderItem}
            refreshControl={<RefreshControl refreshing={this.state.isRefreshing} onRefresh={this.refreshSuggestions} />}
            style={styles.root}
            contentContainerStyle={styles.contentContainer}
            numColumns={3}
            getItemLayout={this.getItemLayout}
            onLayout={this.onLayout}
            columnWrapperStyle={[styles.columnWrapper, { height: this.state.itemHeight }]}
          />
        )}
      </Container>
    );
  }

  onLayout = () => this.setState({ itemHeight: initialLayout.width / 3 });

  getItemLayout = (data: any, index: number) => {
    const { itemHeight } = this.state;
    return { length: itemHeight, offset: itemHeight * index, index };
  };
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

const whyyyy = withNavigation(connect(mapStateToProps)(SuggestionsContainer));

export const Suggestions = connect(mapStateToProps)(whyyyy);

const MARGIN = 1;

const styles = StyleSheet.create({
  boldText: {
    fontWeight: 'bold',
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: -MARGIN * 2,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 5,
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    height: 250,
    justifyContent: 'center',
    padding: 20,
  },
  root: {
    flex: 1,
  },
  username: {
    color: colors.black,
    marginTop: -26,
  },
  // numOfConns: {
  //   color: colors.black,
  //   marginTop: 2,
  // },
});
