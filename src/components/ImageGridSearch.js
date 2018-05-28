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
import type { UserData } from '../types';

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type Props = {
  terms: any,
  navigation?: NavigationScreenProp<*>,
  userData: UserData,
  emptyState?: React.Component<*>,
};

type State = {
  // loadingMore: boolean,
  hasError: boolean,
  itemHeight: number,
  items: Array<any>,
  loading: boolean,
  refreshing: boolean,
  skip: number,
};

const { width, height } = Dimensions.get('window');

class ImageGridComponent extends React.Component<Props, State> {
  state = {
    hasError: false,
    itemHeight: 0,
    items: [],
    loading: true,
    refreshing: false,
    skip: 0,
  };

  componentDidMount() {
    // const defaultImageCacheManager = ImageCacheManager();
    // defaultImageCacheManager.clearCache();
    // if (terms.tag) {
    this.fetchItems(this.props.terms);
    // }
  }

  fetchItems({ tag, grp_1, grp_2 }): Promise<any> {
    const { token } = this.props.userData;
    const tagQuery = tag == '' ? '' : `tag=${tag}`;
    const categoryQuery = grp_1 == -1 ? '' : `&categoryIds=${grp_1}`;
    const typeQuery = grp_2 == -1 ? '' : `&typeIds=${grp_2}`;
    return api
      .get(`/api/search/?${tagQuery}${categoryQuery}${typeQuery}`, {
        token,
      })
      .then(({ data }) => {
        this.setState({
          items: data,
          loading: false,
        });
      })
      .catch(e => {
        console.debug(e);
        // if the hashtag is incorrect format (e.g #111)
        if (e.message.indexOf('fails to match the required pattern') > -1) {
          return this.setState({
            loading: false,
          });
        }
        this.setState({
          hasError: true,
          loading: false,
        });
      });
  }
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
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
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
    const { loading, items } = this.state;

    return (
      <View style={styles.container}>
        {loading ? (
          this.renderLoading()
        ) : (
          // if not loading or no error
          <FlatList
            // onLayout={this.onLayout}
            style={styles.list}
            columnWrapperStyle={[styles.columnWrapper, { height: width / 3 }]}
            data={items}
            renderItem={this.renderItem}
            numColumns={3}
            keyExtractor={el => el.uuid}
            getItemLayout={this.getItemLayout}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={this.renderEmptyState}
            initialNumToRender={6}
            viewabilityConfig={VIEWABILITY_CONFIG}
            refreshing={false}
            windowSize={6}
          />
        )}
      </View>
    );
  }

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

  renderLoading() {
    return (
      <View style={[styles.container, { height: height - 150 }]}>
        <ActivityIndicator size="large" />
      </View>
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
