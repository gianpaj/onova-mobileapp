// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {
  Button as NBButton,
  Body,
  Container,
  Header,
  Title,
  ListItem,
  Right,
} from 'native-base';
import { withNavigation } from 'react-navigation';

import colors from '../config/colors';
import * as api from '../utils/api';
// import * as ui from '../utils/ui';
import { Avatar } from '../components';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, Dispatch, ReduxState } from '../types';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  data: Array<UserData>,
  isRefreshing: boolean,
};

class FollowingsContainer extends Component<Props, State> {
  state = {};

  async componentWillMount() {
    try {
      await this.getFollowersAndSetState();
    } catch (err) {
      console.error(err);
    }
  }

  async getFollowersAndSetState(): Promise<any> {
    const { token } = this.props.userData;
    // for development
    let userId = '5a78d09d2d314a702698f955';

    if (this.props.navigation.state.params) {
      userId = this.props.navigation.state.params.userId;
    }

    const res = await api.get(
      `/api/users/${userId}/reviews?as=${this.props.as}`,
      {
        token,
      }
    );
    // get the first image size and then setState `data` for the FlatList
    if (res.data && res.data.length) {
      return this.setState({ data: res.data });
    }
    this.setState({ data: [] });
  }

  goToProfile = (user: UserData) => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'profile',
      params: user,
      key: `profile-${user.username}`,
    });
  };

  onFollowOrUnfollow(_id: string) {
    const token = this.props.userData.token;
    const followOrUnfollow = !this.state.isFollowing ? 'follow' : 'unfollow';
    api
      .post(`/api/users/${_id}/${followOrUnfollow}`, {}, { token })
      .then(() => {
        console.warn('followed', _id);
        // this.setState({ isFollowing: followOrUnfollow == 'follow' });
      })
      .catch(err => {
        console.error(err);
      });
  }

  _renderItem = ({ item: user }: { item: UserData }) => {
    const isFollowing = false;

    return (
      <TouchableHighlight
        underlayColor={colors.grey4}
        onPress={() => this.goToProfile(user)}>
        <ListItem style={{ marginLeft: 0 }}>
          <Avatar
            // style={styles.avatarContainer}
            size={'small'}
            withBorder
            uri={user.profilePic}
            placeholderText={user.username}
          />
          <Body>
            <View style={styles.contentRow}>
              <Text
                style={styles.name}
                numberOfLines={1} // android
              >
                @{user.username}
              </Text>
            </View>
            <Text
              style={styles.reviewText}
              numberOfLines={3} // android
            >
              {user.displayName}
            </Text>
          </Body>
          <Right style={{ height: '100%' }}>
            <NBButton
              transparent
              bordered
              small
              full
              style={styles.editOrFollowButton}
              onPress={() => this.onFollowOrUnfollow(user._id)}>
              <Text style={styles.editOrFollowButtonText}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </NBButton>
          </Right>
        </ListItem>
      </TouchableHighlight>
    );
  };

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  renderEmptyState = () => {
    // if (!this.state.showingResults) return null;

    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.container}>
        <Text>{this.state.hasError ? 'Error' : 'There are no reviews'}</Text>
      </View>
    );
  };

  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Title>Following</Title>
          </Body>
        </Header>
        <FlatList
          data={this.state.data}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          renderItem={this._renderItem}
          // refreshControl={
          //   <RefreshControl
          //     refreshing={this.state.isRefreshing}
          //     onRefresh={this.refreshReviews}
          //   />
          // }
          style={styles.root}
        />
      </Container>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

const Followings2 = withNavigation(
  connect(mapStateToProps)(FollowingsContainer)
);

export const Followings = connect(mapStateToProps)(Followings2);

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bgDefault,
    height: '100%',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },

  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    color: colors.grey1,
    fontWeight: '800',
    width: '55%',
  },
  reviewText: {
    flex: 1,
    textAlignVertical: 'bottom', // android
    paddingBottom: 5,
  },
});
