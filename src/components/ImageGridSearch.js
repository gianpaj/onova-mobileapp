// @flow

import React from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import {
//   CachedImage,
//   ImageCacheProvider,
//   // ImageCacheManager,
// } from 'react-native-cached-image'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationActions } from 'react-navigation';

import type { NavigationScreenProp } from 'react-navigation';

import I18n from '../i18n';
import * as api from '../utils/api';
import typography from '../config/typography';
import colors from '../config/colors';

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const LIMIT = 48; // divisible by 3

type Props = {
  terms: any,
  navigation?: NavigationScreenProp<*>,
  token: string,
  emptyState?: React.Component<*>,
};

type State = {
  // loadingMore: boolean,
  hasError: boolean,
  initializing: boolean,
  isLoading: boolean,
  isRefreshing: boolean,
  itemHeight: number,
  items: Array<any>,
};

const { width, height } = Dimensions.get('window');

class ImageGridSearchComponent extends React.Component<Props, State> {
  state = {
    hasError: false,
    initializing: true,
    isLoading: false,
    isRefreshing: false,
    itemHeight: 0,
    items: [],
  };

  componentDidMount() {
    // const defaultImageCacheManager = ImageCacheManager();
    // defaultImageCacheManager.clearCache();

    this.fetchItems()
      .catch(() => this.setState({ hasError: true }))
      .then(() => this.setState({ initializing: false }));
  }

  /**
   * used when pulling and refreshing AND when initially
   */
  fetchItems = (): Promise<any> => {
    const { tag, grp_1, grp_2 } = this.props.terms;
    this.setState({ isLoading: true });
    const { token } = this.props;
    const tagQuery = tag == '' ? '' : `tag=${tag}`;
    const categoryQuery = grp_1 == -1 ? '' : `&categoryIds=${grp_1}`;
    const typeQuery = grp_2 == -1 ? '' : `&typeIds=${grp_2}`;

    return api
      .get(
        `/api/search/?${tagQuery}${categoryQuery}${typeQuery}&limit=${LIMIT}`,
        {
          token,
        }
      )
      .then(({ data }) => {
        const lastItem = data[data.length - 1];
        this.setState({
          isLoading: false,
          isRefreshing: false,
          items: data,
          lastId: data.length ? lastItem._id : '',
          theEnd: false,
        });
      })
      .catch(e => {
        // if the hashtag is incorrect format (e.g #111)
        if (e.message.indexOf('fails to match the required pattern') > -1) {
          return this.setState({
            isLoading: false,
            isRefreshing: false,
          });
        }
        this.setState({
          hasError: true,
          isLoading: false,
          isRefreshing: false,
        });
        console.error(e);
      });
  };

  loadMore = () => {
    const { lastId, items, theEnd, isRefreshing } = this.state;

    if (theEnd || isRefreshing) return;

    const { tag, grp_1, grp_2 } = this.props.terms;
    const tagQuery = tag == '' ? '' : `tag=${tag}`;
    const categoryQuery = grp_1 == -1 ? '' : `&categoryIds=${grp_1}`;
    const typeQuery = grp_2 == -1 ? '' : `&typeIds=${grp_2}`;

    if (this.reqTimer) {
      clearTimeout(this.reqTimer);
    }
    this.setState({ isRefreshing: true }, async () => {
      const { token } = this.props;
      this.reqTimer = setTimeout(async () => {
        try {
          const { data } = await api.get(
            `/api/search/?${tagQuery}${categoryQuery}${typeQuery}&lastId=${lastId}&limit=${LIMIT}`,
            { token }
          );

          if (data.length == 0) {
            return this.setState({
              isRefreshing: false,
              isLoading: false,
              theEnd: true,
            });
          }
          const lastItem = data[data.length - 1];

          const map = items.map(i => i._id);

          const filtered = data.filter(i => -1 === map.indexOf(i._id));

          this.setState({
            items: [...items, ...filtered],
            lastId: lastItem._id,
            isRefreshing: false,
            isLoading: false,
          });
        } catch (err) {
          this.setState({
            hasError: true,
            isRefreshing: false,
            isLoading: false,
          });
          console.error(err);
        }
      }, 200);
    });
  };

  // onLayout = () => this.setState({ itemHeight: width / 3 });

  getItemLayout = (data: any, index: number) => {
    const { itemHeight } = this.state;
    return { length: itemHeight, offset: itemHeight * index, index };
  };

  onItemPress(item: any) {
    const navigateToProduct = NavigationActions.navigate({
      routeName: 'product',
      key: `product-${item.uuid}`,
      params: item,
    });

    if (this.props.navigation)
      this.props.navigation.dispatch(navigateToProduct);
  }

  renderItem = ({ item }: any) => {
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
    return (
      <View style={styles.imageContainer} key={item.uuid}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => this.onItemPress(item)}>
          {/* <ImageCacheProvider
            numberOfConcurrentPreloads={3}
            ttl={TTL} // num of seconds to cache the image url for
            defaultSource={isLoading}
            // urlsToPreload={this.state.images}
          >
            <CachedImage style={styles.image} source={{ uri }} />
          </ImageCacheProvider> */}
          <Image style={styles.image} source={{ uri }} />
        </TouchableOpacity>
      </View>
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
          initialNumToRender={12}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          numColumns={3}
          onRefresh={this.fetchItems}
          refreshing={isLoading}
          renderItem={this.renderItem}
          // showsVerticalScrollIndicator={false}
          style={styles.list}
          viewabilityConfig={VIEWABILITY_CONFIG}
          windowSize={6}
          onEndReached={this.loadMore}
          onEndReachedThreshold={0.1}
        />
      </View>
    );
  }

  _keyExtractor = (item): string => item.uuid;

  renderEmptyState = () => {
    if (this.state.hasError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.centerText}>{I18n.t('image_grid.error')}</Text>
        </View>
      );
    }

    if (this.props.emptyState) return this.props.emptyState;

    return (
      <View style={styles.emptyContainer}>
        <Icon
          size={typography.empty_state_icon}
          name={'hanger'}
          color={colors.grey2}
          style={{ alignSelf: 'center', marginBottom: 30 }}
        />
        <Text style={styles.boldText}>
          {I18n.t('image_grid_search.empty_state_title')}
        </Text>
        <Text style={styles.centerText}>
          {I18n.t('image_grid_search.empty_state_body')}
        </Text>
      </View>
    );
  };
}

const mapStateToProps = (state: any) => ({
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(ImageGridSearchComponent);

const MARGIN = 1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
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
