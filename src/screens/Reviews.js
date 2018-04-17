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
import { Body, Container, Header, Title } from 'native-base';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';
import { withNavigation } from 'react-navigation';
import StarRating from 'react-native-star-rating';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';

import type { UserData, Dispatch, ReduxState, Review } from '../types';

const { width } = Dimensions.get('window');

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type R_Prop = {
  navigation: any,
  userData: UserData,
  as: string,
};
type R_State = {
  data: Array<Review>,
  imageHeight: number,
  isRefreshing: boolean,
};

class ReviewsTabContainer extends Component<R_Prop, R_State> {
  state = {
    data: [],
    imageHeight: 0,
    isRefreshing: false,
  };

  async componentWillMount() {
    try {
      await this.getReviewsAndSetState();
      // console.warn(data);
    } catch (err) {
      return void console.error(err);
    }
  }

  async getReviewsAndSetState(): Promise<any> {
    const { token } = this.props.userData;

    const res = await api.get(
      `/api/users/${this.props.userData._id}/reviews?as=${this.props.as}`,
      // `/api/users/5a78d09d2d314a702698f955/reviews?as=${this.props.as}`,
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
        <View style={styles.itemContainer}>
          <Image
            style={{ width: width / 4, height: this.state.imageHeight }}
            source={{ uri: order.product.photoURIs[0] }}
          />
          <View style={[styles.flex1, styles.content]}>
            <View style={styles.contentRow}>
              <Text
                numberOfLines={1} // android
              >
                {order.priceOfItem} {order.currency}
              </Text>
              <Text
                numberOfLines={1} // android
              >
                {ui.formatTime(review.createdAt)}
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
          </View>
        </View>
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

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

const ReviewsTab = withNavigation(
  connect(mapStateToProps)(ReviewsTabContainer)
);

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
};

type State = {
  index: number,
  routes: Array<any>,
};

export class Reviews extends Component<Props, State> {
  state = {
    index: 0,
    routes: [
      { key: 'sold', title: 'Sold' },
      { key: 'purchased', title: 'Purchased' },
    ],
  };

  _handleIndexChange = index => this.setState({ index });

  _renderHeader = props => (
    <TabBar
      indicatorStyle={styles.indicator}
      labelStyle={styles.label}
      style={styles.tabbar}
      {...props}
    />
  );

  _renderScene = SceneMap({
    sold: () => <ReviewsTab as="seller" />,
    purchased: () => <ReviewsTab as="buyer" />,
  });

  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Title>Reviews</Title>
          </Body>
        </Header>
        <TabViewAnimated
          navigationState={this.state}
          renderScene={this._renderScene}
          renderHeader={this._renderHeader}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
        />
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  tabbar: {
    backgroundColor: colors.white,
  },
  root: {
    backgroundColor: colors.bgDefault,
    height: '100%',
  },
  label: {
    color: colors.black,
    fontWeight: '400',
  },
  indicator: {
    backgroundColor: colors.pDark,
  },
  flex1: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
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
