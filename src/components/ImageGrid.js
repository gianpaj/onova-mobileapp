// @flow

import React from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  Dimensions,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import {
//   CachedImage,
//   ImageCacheProvider,
//   ImageCacheManager,
// } from 'react-native-cached-image';
import { NavigationActions } from 'react-navigation';
import { Button } from 'react-native-elements';

import type { NavigationScreenProp } from 'react-navigation';

import * as api from '../utils/api';
import colors from '../config/colors';
import type { UserData } from '../types';

// $FlowFixMe
// const loading = require('../assets/images/loading.jpg');
// const TTL = 4 * 60 * 60; // cache images for 4 hours

// @TODO: define type of Item

type Props = {
  apiURL: string,
  navigation?: NavigationScreenProp<*>,
  userData: UserData,
  emptyState?: React.Component,
};

type State = {
  error: boolean,
  items: Array<any>,
  itemHeight: number,
  loading: boolean,
  // loadingMore: boolean,
  refreshing: boolean,
  skip: number,
};

const { width, height } = Dimensions.get('window');

class ImageGridComponent extends React.Component<Props, State> {
  state = {
    error: false,
    items: [],
    itemHeight: 0,
    loading: true,
    refreshing: false,
    skip: 0,
  };

  componentDidMount() {
    // const defaultImageCacheManager = ImageCacheManager();
    // defaultImageCacheManager.clearCache();
    this.fetchItems();
  }

  fetchItems = () => {
    const { token } = this.props.userData;

    return api
      .get(this.props.apiURL, { token })
      .then(({ data }) => {
        this.setState({
          items: data,
          loading: false,
        });
      })
      .catch(() => {
        this.setState({
          error: true,
        });
      });
  };

  onLayout = () => {
    this.setState({
      itemHeight: width / 3,
    });
  };

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
    const uri = JSON.parse(JSON.stringify(item)).photoURIs[0];
    return (
      <View style={styles.imageContainer} id={item.uuid}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => this.onItemPress(item)}>
          {/* <ImageCacheProvider
            numberOfConcurrentPreloads={3}
            ttl={TTL} // num of seconds to cache the image url for
            defaultSource={loading}
            // urlsToPreload={this.state.images}
          >
            <CachedImage style={styles.image} source={{ uri }} />
          </ImageCacheProvider> */}
          <Image style={styles.image} source={{ uri }} />
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const { error, loading, items } = this.state;

    return (
      <View style={styles.container}>
        {!error && loading ? (
          this.renderLoading()
        ) : (
          // if not loading
          <FlatList
            onLayout={this.onLayout}
            style={styles.list}
            columnWrapperStyle={[
              styles.columnWrapper,
              { height: this.state.itemHeight },
            ]}
            refreshControl={this.renderRefreshControl()}
            data={items}
            renderItem={this.renderItem}
            numColumns={3}
            keyExtractor={el => el.uuid}
            getItemLayout={this.getItemLayout}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={this.renderEmptyState}
          />
        )}
      </View>
    );
  }

  renderEmptyState = () => {
    if (this.state.items.length > 1) return null;

    if (this.state.error) {
      return (
        <View style={[styles.container, { height: height - 150 }]}>
          <Text style={styles.centerText}>Error fetching listing</Text>
        </View>
      );
    }

    if (this.props.emptyState) return this.props.emptyState;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.boldText}>There are no items to browse</Text>
        <Text style={styles.centerText}>
          The more sellers you follow, the more items you'll see in your feed
        </Text>
        <Button
          raised
          rounded
          backgroundColor={colors.pDark}
          containerViewStyle={styles.searchButton}
          onPress={() => alert('code me like those french girls 🎨')}
          title="Search"
        />
      </View>
    );
  };

  renderLoading() {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  renderRefreshControl() {
    return (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={this.fetchItems}
      />
    );
  }
}

const mapStateToProps = (state: any) => ({
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(ImageGridComponent);

const MARGIN = 1;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: colors.transparent,
    marginTop: 20,
  },
  list: {
    flex: 1,
    marginTop: -1,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: -MARGIN * 2,
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
    height: height - 150,
    justifyContent: 'center',
    padding: 20,
  },
});
