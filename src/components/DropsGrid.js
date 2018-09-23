// @flow

import React from 'react';
import { connect } from 'react-redux';

import {
  ActivityIndicator,
  Dimensions,
  Image,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Button } from 'native-base';

import type { NavigationScreenProp } from 'react-navigation';

import { disableRefresh } from '../actions/actionCreator';

import I18n from '../i18n';
import * as api from '../utils/api';
import colors from '../config/colors';

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type Props = {
  username: string,
  emptyState?: React.Component<*>,
  focused: boolean,
  navigation?: NavigationScreenProp<*>,
  shouldRefresh?: boolean,
  token?: string,
};

type State = {
  hasError: boolean,
  isLoading: boolean,
  isRefreshing: boolean,
  items: Array<any>,
  lastId: string,
  theEnd: boolean,
};

const { width, height } = Dimensions.get('window');

class ImageGridComponent extends React.PureComponent<Props, State> {
  reqTimer = 0;
  firstFocus = true;
  state = {
    hasError: false,
    isLoading: false,
    isRefreshing: false,
    items: [],
    lastId: '',
    theEnd: false,
  };

  componentDidMount() {
    if (this.props.focused) {
      this.firstFocus = false;
      this.fetchItems();
    }

    this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        setTimeout(() => {
          this.fetchItems();
          this.props.dispatch(disableRefresh());
        }, 1000);
      }
    });
  }

  componentDidUpdate() {
    if (this.firstFocus && this.props.focused) {
      this.firstFocus = false;
      this.fetchItems();
    }
  }

  /**
   * used when pulling and refreshing AND when initially
   */
  fetchItems = async () => {
    this.setState({ isLoading: true });
    const { token, username } = this.props;

    try {
      // &limit=${LIMIT}
      const { data } = await api.get(`/api/products?username=${username}`, {
        token,
      });
      const lastItem = data[data.length - 1];
      this.setState({
        items: data,
        isLoading: false,
        isRefreshing: false,
        lastId: data.length > 0 ? lastItem._id : '',
      });
    } catch (err) {
      this.setState({
        hasError: true,
        isLoading: false,
        isRefreshing: false,
      });
      console.error(err);
    }
  };

  getItemLayout(data: any, index: number) {
    const itemHeight = width / 3;
    return { length: itemHeight, offset: itemHeight * index, index };
  }

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
          <Image style={styles.image} source={{ uri }} />
        </TouchableOpacity>
      </View>
    );
  };

  renderFooter = () => {
    if (!this.state.isRefreshing) return null;

    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  };

  render() {
    const { hasError, isLoading, items } = this.state;

    if (this.firstFocus) return null;

    if (!hasError && isLoading) return this.renderLoading();

    return (
      <View style={styles.container}>
        <FlatList
          columnWrapperStyle={[styles.columnWrapper, { height: width / 3 }]}
          data={items}
          getItemLayout={this.getItemLayout}
          initialNumToRender={6}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          numColumns={3}
          onRefresh={this.fetchItems}
          refreshing={isLoading}
          ListFooterComponent={this.renderFooter}
          renderItem={this.renderItem}
          style={styles.list}
          viewabilityConfig={VIEWABILITY_CONFIG}
          windowSize={6}
        />
      </View>
    );
  }

  _keyExtractor = (item): string => item.uuid;

  renderEmptyState = () => {
    if (this.state.items.length > 1) return null;

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
        <Text style={styles.boldText}>
          {I18n.t('image_grid.empty_state_title')}
        </Text>
        <Text style={styles.centerText}>
          {I18n.t('image_grid.empty_state_body')}
        </Text>
        <Button
          block
          style={styles.searchButton}
          onPress={() => this.props.navigation.navigate('search')}>
          <Text
            // eslint-disable-next-line
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

  renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
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
