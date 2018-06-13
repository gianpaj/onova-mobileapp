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
import { Body, Button, Container, Icon, Left, Right, Title } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { withNavigation } from 'react-navigation';

import I18n from '../i18n';
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
  isLoading: boolean,
  itemHeight: number,
};

class FollowersContainer extends Component<Props, State> {
  state = {
    isRefreshing: false,
    isLoading: true,
    data: [],
    itemHeight: -1,
  };

  async componentWillMount() {
    try {
      await this.getFollowersAndSetState();
      this.setState({ isLoading: false });
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
    let routeName = 'profileInStack';
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
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
        style={{ width: initialLayout.width / 3 }}
        underlayColor={colors.grey4}
        onPress={() => this.goToProfile(user)}>
        <View style={{ alignItems: 'center' }}>
          <Avatar
            size={'medium'}
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
              shouldShowButton ? { marginTop: -26 } : { marginTop: 10 },
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

  renderEmptyState = () => {
    // if (!this.state.showingResults) return null;

    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          size={48}
          name={'account-multiple-plus'}
          color={colors.grey2}
          style={{ alignSelf: 'center', marginBottom: 30 }}
        />
        <Text style={styles.boldText}>
          {I18n.t('followers.empty_state_message_title')}
        </Text>
        <Text>{I18n.t('followers.empty_state_message_body')}</Text>
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

  renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );

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
            <Title style={{ color: colors.black }}>
              {I18n.t('followers.header')}
            </Title>
          </Body>
          <Right />
        </Header>
        {this.state.isLoading ? (
          this.renderLoading()
        ) : (
          <FlatList
            data={this.state.data}
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
            contentContainerStyle={styles.contentContainer}
            numColumns={3}
            getItemLayout={this.getItemLayout}
            onLayout={this.onLayout}
            columnWrapperStyle={[
              styles.columnWrapper,
              { height: this.state.itemHeight },
            ]}
          />
        )}
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
  contentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  root: {
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    height: 250,
    justifyContent: 'center',
    padding: 20,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: -MARGIN * 2,
  },
});
