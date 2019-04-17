// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  FlatList,
  // Image,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { withNavigation } from 'react-navigation';
import ParsedText from 'react-native-parsed-text';

import I18n from '../i18n';
import colors from '../config/colors';
import * as api from '../utils/api';
import { addErrorBreadcrumb } from '../utils/analytics';
import * as linking from '../utils/linking';

import ReviewCard from '../components/ReviewCard';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, ReduxState, Review, Order } from '../types';

const { width } = Dimensions.get('window');

type Props = {
  as: string,
  navigation: NavigationScreenProp<*>,
  token: string,
  userData: UserData,
};

type State = {
  data: Array<Review | Order>,
  imageHeight: number,
  isRefreshing: boolean,
};

class ReviewsTabContainer extends Component<Props, State> {
  state = {
    data: [],
    // all thumbnails are 240 px wide
    imageHeight: Math.floor(240 * (width / 4 / 240)),
    // imageHeight: 0,
    isRefreshing: false,
  };

  async componentDidMount() {
    try {
      await this.getReviewsAndSetState();
    } catch (err) {
      console.error(err);
    }
  }

  async getReviewsAndSetState(): Promise<void> {
    const { token } = this.props;
    // for development
    // (firstuser) on local server
    let userId = '5a78d09e2d314a702698f957';
    // (alex) on prod server
    // let userId = '5afaa93daeeb1453812fc011';

    if (this.props.navigation.state.params) {
      userId = this.props.navigation.state.params.userId;
    }

    const { data } = await api.get(`/api/users/${userId}/reviews?as=${this.props.as}`, { token });
    // get the first image size and then setState `data` for the FlatList
    if (data && data.length) {
      // const uri = data[0].product.photoURIs[0].replace('.jpg', '-thumb.jpg');
      // Image.getSize(uri, (w, h) => {
      // imageHeight: Math.floor(h * (width / 4 / w)),
      this.setState({ data });
      // });
    }
  }

  refreshReviews = async () => {
    this.setState({ isRefreshing: true });
    try {
      await this.getReviewsAndSetState();
      this.setState({ isRefreshing: false });
    } catch (error) {
      console.debug(error);
      addErrorBreadcrumb({ category: 'review', error });
      // this.setState({ hasError: true });
    }
  };

  goToProfile = (user: UserData) =>
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'profileInStack',
      params: user,
      key: `profile-${user.username}`,
    });

  renderEmptyState = (
    <View style={styles.emptyStateContainer}>
      <ParsedText
        style={styles.emptyText}
        parse={[
          { type: 'email', style: styles.url, onPress: linking.email },
          // {
          //   pattern: /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{2,3}[-\s\.]?[0-9]{2,3}/,
          //   style: styles.url,
          //   onPress: linking.call,
          // },
        ]}>
        {I18n.t('reviews.empty_state_message')}
      </ParsedText>
    </View>
  );

  _keyExtractor = (item): string => item.id;

  _renderSeparator = () => <View style={styles.separator} />;

  _renderItem = ({ item }) => (
    <ReviewCard as={this.props.as} onPress={this.goToProfile} order={item} userData={this.props.userData} />
  );

  render() {
    return (
      <View style={styles.flex1}>
        <FlatList
          data={this.state.data}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          renderItem={this._renderItem}
          refreshControl={<RefreshControl refreshing={this.state.isRefreshing} onRefresh={this.refreshReviews} />}
          style={styles.root}
        />
      </View>
    );
  }
}

// Inject dispatch and userData
const mapStateToProps: any = (state: ReduxState) => ({
  token: state.LoginReducer.token,
  userData: state.LoginReducer.data,
});

export const ReviewsTab = withNavigation(connect(mapStateToProps)(ReviewsTabContainer));

const styles = StyleSheet.create({
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 4,
    margin: 18,
    textAlign: 'center',
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
  url: {
    color: colors.active,
    textDecorationLine: 'underline',
  },
});
