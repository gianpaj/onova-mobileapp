// @flow

import React from 'react';
import { connect } from 'react-redux';

import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
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
  hasError: boolean,
  initializing: boolean,
  isLoading: boolean,
  isRefreshing: boolean,
  items: Array<any>,
  lastId: string,
  theEnd: boolean,
};

const { width, height } = Dimensions.get('window');

class ImageGridSearchComponent extends React.Component<Props, State> {
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
  }

  /**
   * used when pulling and refreshing AND when initially
   */
  fetchItems = async () => {
    const loader = setTimeout(() => {
      this.setState({ isLoading: true });
    }, 300);
    const { token, terms } = this.props;
    const { tag, grp_1, grp_2 } = terms;
    const tagQuery = tag == '' ? '' : `tag=${tag}`;
    const categoryQuery = grp_1 == -1 ? '' : `&categoryIds=${grp_1}`;
    const typeQuery = grp_2 == -1 ? '' : `&typeIds=${grp_2}`;

    try {
      const { data } = await api.get(`/api/search/?${tagQuery}${categoryQuery}${typeQuery}&limit=${LIMIT}`, {
        token,
      });
      const lastItem = data[data.length - 1];
      this.setState({
        items: data,
        lastId: data.length ? lastItem._id : '',
        theEnd: false,
      });
    } catch (err) {
      // if the hashtag is incorrect format (e.g #111)
      if (err.message.indexOf('fails to match the required pattern') > -1) {
        return;
      }
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

  // onLayout = () => this.setState({ itemHeight: width / 3 });

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
        {/* <Image style={styles.image} source={{ uri }} /> */}
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
          onRefresh={this.fetchItems}
          refreshing={isLoading}
          renderItem={this.renderItem}
          // showsVerticalScrollIndicator={false}
          style={styles.list}
          viewabilityConfig={VIEWABILITY_CONFIG}
          windowSize={6}
          onEndReached={this.loadMore}
          onEndReachedThreshold={0.1}
          horizontal={false}
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
        <Text style={styles.boldText}>{I18n.t('image_grid_search.empty_state_title')}</Text>
        <Text style={styles.centerText}>{I18n.t('image_grid_search.empty_state_body')}</Text>
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
  boldText: {
    fontWeight: 'bold',
  },
  centerText: {
    textAlign: 'center',
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    height: height - 250,
    justifyContent: 'center',
    padding: 20,
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
  list: {
    flex: 1,
    marginTop: -1,
  },
});
