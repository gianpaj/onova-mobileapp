// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Body, ListItem, Right } from 'native-base';
import { withNavigation } from 'react-navigation';
import StarRating from 'react-native-star-rating';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

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

  async getReviewsAndSetState(): Promise<any> {
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
      const { data } = res;
      Image.getSize(data[0].order.product.photoURIs[0], (w, h) => {
        this.setState(
          {
            imageHeight: Math.floor(h * (width / 4 / w)),
            data,
          },
          () => {
            Promise.resolve();
          }
        );
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
    const { _id } = this.props.userData;
    let routeName = 'profileInStack';
    if (_id == user._id) {
      routeName = 'profile';
    }
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
  };

  renderEmptyState = () => {
    if (!this.state.showingResults) return null;

    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.container}>
        <Text>{this.state.hasError ? 'Error' : 'There are no reviews'}</Text>
      </View>
    );
  };

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  _renderItem = ({ item: review }: { item: Review }) => {
    const { order } = review;

    const reviewer =
      order.seller == review.fromUser ? order.seller : order.buyer;

    return (
      <TouchableHighlight
        underlayColor={colors.grey4}
        onPress={() => this.goToProfile(reviewer)}>
        <ListItem style={{ marginLeft: 0 }}>
          <Image
            style={[
              styles.itemImage,
              {
                width: width / 4,
                height: this.state.imageHeight,
              },
            ]}
            source={{ uri: order.product.photoURIs[0] }}
          />
          <Body>
            <View style={styles.contentRow}>
              <Text
                numberOfLines={1} // android
              >
                {order.priceOfItem} {order.currency}
              </Text>
            </View>
            <View style={styles.contentRow}>
              <StarRating
                // eslint-disable-next-line
                buttonStyle={{ paddingHorizontal: 2 }}
                // eslint-disable-next-line
                containerStyle={{ alignSelf: 'center' }}
                disabled
                emptyStar={
                  Platform.OS == 'ios' ? 'ios-star-outline' : 'md-star-outline'
                }
                emptyStarColor={colors.yellow}
                fullStar={Platform.OS == 'ios' ? 'ios-star' : 'md-star'}
                fullStarColor={colors.yellow}
                iconSet="Ionicons"
                rating={review.rateNumber}
                starSize={20}
              />
              <Text
                style={styles.name}
                numberOfLines={1} // android
              >
                @{reviewer.username}
              </Text>
            </View>
            <Text
              style={styles.reviewText}
              numberOfLines={3} // android
            >
              {review.text}
            </Text>
          </Body>
          <Right style={{ height: '100%' }}>
            <Text
              numberOfLines={1} // android
            >
              {ui.formatTime(review.createdAt)}
            </Text>
          </Right>
        </ListItem>
      </TouchableHighlight>
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

  itemImage: {
    marginHorizontal: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey4,
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
