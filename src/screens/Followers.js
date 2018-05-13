// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Body, Button, Container, Icon, Left, Right, Title } from 'native-base';
import { withNavigation } from 'react-navigation';

import colors from '../config/colors';
import * as api from '../utils/api';
// import * as ui from '../utils/ui';
import { Avatar, Header } from '../components';

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
  itemHeight: number,
};

class FollowersContainer extends Component<Props, State> {
  state = {
    isRefreshing: false,
    data: [],
    itemHeight: -1,
  };

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
    let userId = '5ac5ebcd939b7f1712b92baf';

    if (this.props.navigation.state.params) {
      userId = this.props.navigation.state.params.userId;
    }

    const res = await api.get(`/api/users/${userId}/followers`, {
      token,
    });
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

  onFollowOrUnfollow(_id: string, amIAFollower: boolean) {
    const { token } = this.props.userData;
    const followOrUnfollow = amIAFollower ? 'unfollow' : 'follow';
    api
      .post(`/api/users/${_id}/${followOrUnfollow}`, {}, { token })
      .then(() => {
        console.debug(followOrUnfollow, _id);
        // this.setState({ isFollowing: followOrUnfollow == 'follow' });
        this.refreshFollowers();
      })
      .catch(err => {
        console.error(err);
      });
  }

  _renderItem = ({ item: user }: { item: UserData }) => {
    const { _id } = this.props.userData;

    const shouldShowButton = user._id !== _id;
    return (
      <TouchableHighlight
        style={{ width: initialLayout.width / 3, paddingVertical: 20 }}
        underlayColor={colors.grey4}
        onPress={() => this.goToProfile(user)}>
        <View style={{ alignItems: 'center' }}>
          <Avatar
            size={'small'}
            withButton={shouldShowButton}
            uri={user.profilePic}
            placeholderText={user.username}
            buttonActiveState={user.amIAFollower}
            onButtonPress={() =>
              this.onFollowOrUnfollow(user._id, user.amIAFollower)
            }
            onPress={() => this.goToProfile(user)}
          />
          <Text
            style={[
              { color: colors.black },
              shouldShowButton ? { marginTop: -10 } : { marginTop: 10 },
            ]}
            numberOfLines={1} /* android */
          >
            @{user.username}
          </Text>
        </View>
      </TouchableHighlight>
    );
  };

  _keyExtractor = (item): string => item.dateCreated;

  _renderSeparator = () => <View style={styles.separator} />;

  renderEmptyState = () => {
    // if (!this.state.showingResults) return null;

    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.container}>
        <Text>There are no followers</Text>
      </View>
    );
  };

  refreshFollowers = () => {
    this.setState({ isRefreshing: true });
    this.getFollowersAndSetState()
      .catch(err => {
        console.debug(err);
        // this.setState({ hasError: true });
      })
      .then(() => this.setState({ isRefreshing: false }));
  };

  render() {
    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>Followers</Title>
          </Body>
          <Right />
        </Header>
        <FlatList
          data={this.state.data}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          renderItem={this._renderItem}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshFollowers}
            />
          }
          style={styles.root}
          numColumns={3}
          getItemLayout={this.getItemLayout}
          onLayout={this.onLayout}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={[
            styles.columnWrapper,
            { height: this.state.itemHeight },
          ]}
        />
      </Container>
    );
  }

  onLayout = () => {
    this.setState({ itemHeight: initialLayout.width / 3 });
  };

  getItemLayout = (data: any, index: number) => {
    const { itemHeight } = this.state;
    return { length: itemHeight, offset: itemHeight * index, index };
  };
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

const Followers2 = withNavigation(connect(mapStateToProps)(FollowersContainer));

export const Followers = connect(mapStateToProps)(Followers2);

const MARGIN = 1;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  root: {
    height: '100%',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: -MARGIN * 2,
  },
});
