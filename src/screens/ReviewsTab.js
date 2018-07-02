// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { withNavigation } from 'react-navigation';

import I18n from '../i18n';
import colors from '../config/colors';
import * as api from '../utils/api';
import ReviewCard from '../components/ReviewCard';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, ReduxState, Review } from '../types';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  as: string,
};

type State = {
  data: Array<Review>,
  imageHeight: number,
  isRefreshing: boolean,
};

class ReviewsTabContainer extends Component<Props, State> {
  state = {
    data: [],
    imageHeight: 0,
    isRefreshing: false,
  };

  async componentWillMount() {
    try {
      await this.getReviewsAndSetState();
    } catch (err) {
      console.error(err);
    }
  }

  async getReviewsAndSetState(): Promise<void> {
    const { token } = this.props.userData;
    // for development
    // (firstuser) on local server
    // let userId = '5a78d09e2d314a702698f957';
    // (alex) on prod server
    let userId = '5afaa93daeeb1453812fc011';

    if (this.props.navigation.state.params) {
      userId = this.props.navigation.state.params.userId;
    }

    const res = await api.get(
      `/api/users/${userId}/reviews?as=${this.props.as}`,
      { token }
    );
    // get the first image size and then setState `data` for the FlatList
    if (res.data && res.data.length) {
      const { data } = res;
      const uri = data[0].order.product.photoURIs[0].replace(
        '.jpg',
        '-thumb.jpg'
      );
      Image.getSize(uri, (w, h) => {
        this.setState({
          imageHeight: Math.floor(h * (width / 4 / w)),
          data,
        });
      });
    } else {
      this.setState({ data: [] });
    }
  }

  refreshReviews = () => {
    this.setState({ isRefreshing: true });
    this.getReviewsAndSetState()
      .catch(err => {
        console.debug(err);
        // this.setState({ hasError: true });
      })
      .then(() => this.setState({ isRefreshing: false }));
  };

  goToProfile = (user: UserData) => {
    let routeName = 'profileInStack';
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
  };

  renderEmptyState = () => {
    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={{ textAlign: 'center' }}>
          {I18n.t('reviews.empty_state_message')}
        </Text>
      </View>
    );
  };

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  _renderItem = ({ item }) => {
    return (
      <ReviewCard review={item} as={this.props.as} onPress={this.goToProfile} />
    );
  };

  render() {
    return (
      <View style={styles.flex1}>
        <FlatList
          data={this.state.data}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          renderItem={this._renderItem}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshReviews}
            />
          }
          style={styles.root}
        />
      </View>
    );
  }
}

// Inject dispatch and userData
const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const ReviewsTab = withNavigation(
  connect(mapStateToProps)(ReviewsTabContainer)
);

const styles = StyleSheet.create({
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  root: {
    height: '100%',
  },
  flex1: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
});
