// @flow

import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  // $FlowFixMe
} from 'react-native';
import {
  CachedImage,
  ImageCacheProvider,
  // ImageCacheManager,
} from 'react-native-cached-image';
// $FlowFixMe
import { NavigationActions, NavigationScreenProp } from 'react-navigation';

import * as api from '../utils/api';

// $FlowFixMe
const loading = require('../assets/images/loading.jpg');
const TTL = 4 * 60 * 60; // cache images for 4 hours

type Props = {
  apiURL: string,
  navigation?: NavigationScreenProp,
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

export class ImageGridComponent extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
  }

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
    // ?skip=${this.state.skip}
    // setTimeout(() => {
    return api
      .get(this.props.apiURL)
      .then(res => {
        this.setState({
          items: res.data,
          loading: false,
        });
      })
      .catch(() => {
        this.setState({
          error: true,
        });
      });
    // }, 2000);
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
    console.debug(item);
    const navigateToProduct = NavigationActions.navigate({
      routeName: 'product',
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
          <ImageCacheProvider
            numberOfConcurrentPreloads={3}
            ttl={TTL} // num of seconds to cache the image url for
            defaultSource={loading}
            // urlsToPreload={this.state.images}
          >
            <CachedImage style={styles.image} source={{ uri }} />
          </ImageCacheProvider>
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
    return (
      <View style={[styles.container, { height: height - 150 }]}>
        <Text style={styles.text}>
          {this.state.error ? 'Error fetching listing' : 'No items found'}
        </Text>
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

  renderHeader() {
    return <Text>Yo</Text>;
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

export default ImageGridComponent;

const MARGIN = 1;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
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
});
