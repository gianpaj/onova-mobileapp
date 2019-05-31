// @flow

import React from 'react';
import { connect } from 'react-redux';

import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Button } from 'native-base';
import { NavigationActions } from 'react-navigation';

import type { Node } from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch } from '../types';

import { disableRefresh } from '../actions/actionCreator';

import I18n from '../i18n';
import * as api from '../utils/api';
import colors from '../config/colors';

// const loading = require('../assets/images/loading.jpg');
// const TTL = 4 * 60 * 60; // cache images for 4 hours

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const LIMIT = 48; // divisible by 3

// TODO: define type of Item

type Props = {
  apiURL: string,
  dispatch: Dispatch,
  emptyState?: Node,
  navigation?: NavigationScreenProp<*>,
  shouldRefresh?: boolean,
  skippedLogin: boolean,
  header: React.ReactElement,
  token?: string,
  refreshProfile?: () => Promise<any>,
};

type State = {
  hasError: boolean,
  initializing: boolean,
  isLoading: boolean,
  isRefreshing: boolean,
  items: Array<any>,
  lastId: string,
  theEnd: boolean,
};

const { width, height } = Dimensions.get('window');

class ImageGridComponent extends React.PureComponent<Props, State> {
  didFocusListener;
  reqTimer = 0;
  state = {
    hasError: false,
    initializing: true,
    isLoading: false,
    isRefreshing: false,
    items: [],
    lastId: '',
    theEnd: false,
  };

  componentDidMount() {
    // const defaultImageCacheManager = ImageCacheManager();
    // defaultImageCacheManager.clearCache();
    this.fetchItems()
      .catch(() => this.setState({ hasError: true }))
      .then(() => this.setState({ initializing: false }));

    this.didFocusListener = this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        setTimeout(() => {
          this.fetchItems()
            .catch(() => this.setState({ hasError: true }))
            .then(() => this.setState({ initializing: false }));
          this.props.dispatch(disableRefresh());
        }, 1000);
      }
    });
  }

  componentWillUnmount() {
    this.didFocusListener.remove();
  }

  refresh = async () => {
    const { refreshProfile } = this.props;
    try {
      await Promise.all([refreshProfile && refreshProfile(), this.fetchItems()]);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * used when pulling and refreshing AND when initially
   */
  fetchItems = async () => {
    const loader = setTimeout(() => {
      this.setState({ isLoading: true });
    }, 300);
    const { apiURL, token } = this.props;

    try {
      const { data } = await api.get(`${apiURL}&limit=${LIMIT}`, {
        token,
      });
      const lastItem = data[data.length - 1];
      this.setState({
        items: data,
        lastId: data.length ? lastItem._id : '',
        theEnd: false,
      });
    } catch (err) {
      this.setState({
        items: [],
        hasError: true,
      });
      console.error(err);
      throw err;
    } finally {
      clearTimeout(loader);
      this.setState({
        isLoading: false,
        isRefreshing: false,
      });
    }
  };

  loadMore = () => {
    const { lastId, items, theEnd, isRefreshing } = this.state;

    if (theEnd || isRefreshing) return;

    if (this.reqTimer) {
      clearTimeout(this.reqTimer);
    }

    this.setState({ isRefreshing: true }, async () => {
      const { apiURL, token } = this.props;
      this.reqTimer = setTimeout(async () => {
        try {
          const { data } = await api.get(`${apiURL}&lastId=${lastId}&limit=${LIMIT}`, { token });

          if (data.length === 0) return this.setState({ theEnd: true });

          const lastItem = data[data.length - 1];

          const map = items.map(i => i._id);

          const filtered = data.filter(i => -1 === map.indexOf(i._id));

          this.setState({
            items: [...items, ...filtered],
            lastId: lastItem._id,
          });
        } catch (err) {
          this.setState({
            items: [],
            hasError: true,
          });
          console.error(err);
        } finally {
          this.setState({
            isRefreshing: false,
            isLoading: false,
          });
        }
      }, 200);
    });
  };

  getItemLayout = (data: any, index: number) => {
    const itemHeight = width / 3;
    return { length: itemHeight, offset: itemHeight * index, index };
  };

  onItemPress(item: any) {
    const navigateToProduct = NavigationActions.navigate({
      routeName: 'product',
      key: `product-${item.uuid}`,
      params: item,
    });

    if (this.props.navigation) this.props.navigation.dispatch(navigateToProduct);
  }

  renderItem = ({ item }: any) => {
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
    return (
      <TouchableOpacity style={styles.imageContainer} key={item.uuid} onPress={() => this.onItemPress(item)}>
        {/* <ImageCacheProvider
            numberOfConcurrentPreloads={3}
            ttl={TTL} // num of seconds to cache the image url for
            defaultSource={isLoading}
            // urlsToPreload={this.state.images}
          >
            <CachedImage style={styles.image} source={{ uri }} />
          </ImageCacheProvider> */}
        <FastImage
          style={styles.image}
          source={{ uri }}
          // resizeMode={FastImage.resizeMode.contain}
        />
      </TouchableOpacity>
    );
  };

  renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );

  render() {
    const { hasError, isLoading, initializing, items } = this.state;

    if (!hasError && initializing) return this.renderLoading();

    return (
      <View style={styles.container}>
        <FlatList
          // onLayout={this.onLayout}
          columnWrapperStyle={[styles.columnWrapper, { height: width / 3 }]}
          data={items}
          getItemLayout={this.getItemLayout}
          initialNumToRender={6}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          numColumns={3}
          onRefresh={this.refresh}
          refreshing={isLoading}
          renderItem={this.renderItem}
          // showsVerticalScrollIndicator={false}
          style={styles.list}
          viewabilityConfig={VIEWABILITY_CONFIG}
          windowSize={6}
          onEndReached={this.loadMore}
          onEndReachedThreshold={0.1}
          horizontal={false}
          ListHeaderComponent={this.props.header}
        />
      </View>
    );
  }

  _keyExtractor = (item): string => item.uuid;

  renderEmptyState = () => {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, { height: height - 150 }]}>
          <Text style={styles.centerText}>{I18n.t('image_grid.error')}</Text>
        </View>
      );
    }

    if (this.props.emptyState) return this.props.emptyState;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.boldText}>{I18n.t('image_grid.empty_state_title')}</Text>
        <Text style={styles.centerText}>{I18n.t('image_grid.empty_state_body')}</Text>
        <Button block style={styles.searchButton} onPress={() => this.props.navigation.navigate('search')}>
          <Text
            style={{
              fontSize: 16,
              color: colors.white,
            }}>
            {I18n.t('image_grid.empty_state_button')}
          </Text>
        </Button>
      </View>
    );
  };
}

const mapStateToProps = (state: any) => ({
  token: state.LoginReducer.token,
  shouldRefresh: state.RefresherReducer.shouldRefresh,
});

export default connect(
  mapStateToProps,
  null,
  null,
  { withRef: true }
)(ImageGridComponent);

const MARGIN = 1;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  centerText: {
    marginTop: 5,
    textAlign: 'center',
  },
  searchButton: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    marginTop: 20,
    minWidth: 260,
  },
  list: {
    flex: 1,
    marginTop: -1,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: 0,
  },
  image: {
    flex: 1,
    // height: 121,
    margin: MARGIN,
    width: (width + MARGIN * 2) / 3,
  },
  imageContainer: {
    alignItems: 'stretch',
  },
  emptyContainer: {
    alignItems: 'center',
    height: height - 250,
    justifyContent: 'center',
    padding: 20,
  },
});
