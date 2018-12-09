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
  TouchableOpacity,
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

import type { UserData, ReduxState } from '../types';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
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

  async componentDidMount() {
    try {
      const data = await this.getFollowers();
      this.setState({ data });
    } catch (err) {
      console.error(err);
    }
    this.setState({ isLoading: false });
  }

  async getFollowers(): Promise<any> {
    const { token } = this.props;
    // for development
    let userId = '5ac5ebcd939b7f1712b92baf';

    if (this.props.navigation.state.params) {
      userId = this.props.navigation.state.params.userId;
    }

    return api.getFollowers(userId, token);
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

  async onFollowOrUnfollow(_id: string, amIAFollower: boolean) {
    const { token } = this.props;
    const followOrUnfollow = amIAFollower ? 'unfollow' : 'follow';
    console.debug(followOrUnfollow, _id);
    try {
      await api.post(`/api/users/${_id}/${followOrUnfollow}`, {}, { token });
      this.refreshFollowers();
    } catch (err) {
      console.error(err);
    }
  }

  // eslint-disable-next-line react/no-unused-prop-types
  _renderItem = ({ item: user }: { item: UserData }) => {
    const { _id } = this.props.userData;

    const shouldShowButton = user._id !== _id;
    return (
      <TouchableOpacity
        style={{ width: initialLayout.width / 3 }}
        onPress={() => this.goToProfile(user)}>
        <View style={{ alignItems: 'center' }}>
          <Avatar
            size={'medium'}
            withButton={shouldShowButton}
            uri={user.profilePic || ''}
            placeholderText={user.username}
            buttonActiveState={user.amIAFollower}
            onButtonPress={() =>
              this.onFollowOrUnfollow(user._id, user.amIAFollower)
            }
          />
          <Text
            style={[
              { color: colors.black },
              shouldShowButton ? { marginTop: -26 } : { marginTop: 10 },
            ]}
            numberOfLines={1}>
            @{user.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  _keyExtractor = (item): string => item.dateCreated;

  renderEmptyState = (
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

  refreshFollowers = async () => {
    this.setState({ isRefreshing: true });
    try {
      const data = await this.getFollowers();
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
          this.renderLoading
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
