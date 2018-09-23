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
  View,
} from 'react-native';
import { Button, List } from 'native-base';
import { format } from 'date-fns';

import type { NavigationScreenProp } from 'react-navigation';

import { disableRefresh } from '../actions/actionCreator';
import type { Schedule } from '../types';

import I18n from '../i18n';
import * as api from '../utils/api';
import colors from '../config/colors';

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
  items: Array<Schedule>,
};

const { width, height } = Dimensions.get('window');

class DropsGridComponent extends React.PureComponent<Props, State> {
  reqTimer = 0;
  firstFocus = true;
  state = {
    hasError: false,
    isLoading: false,
    isRefreshing: false,
    items: [],
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
      this.setState({ items: data });
    } catch (err) {
      this.setState({ hasError: true });
      console.error(err);
    }
    this.setState({
      isLoading: false,
      isRefreshing: false,
    });
  };

  getItemLayout(data: any, index: number) {
    const itemHeight = width / 3;
    return { length: itemHeight, offset: itemHeight * index, index };
  }

  renderItem = ({ item }: any) => {
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
    return (
      <View style={styles.imageContainer} key={item.uuid}>
        <Image style={styles.image} source={{ uri }} />
      </View>
    );
  };

  renderDropGrid = ({ item }: any) => (
    <View>
      <List>
        <Text style={styles.dateStrings}>
          {format(item.products[0].nextRunAt, 'D MMM HH:mm')}
        </Text>
      </List>
      <FlatList
        data={item.products}
        columnWrapperStyle={[styles.columnWrapper, { height: width / 3 }]}
        keyExtractor={this._keyExtractorDrop}
        getItemLayout={this.getItemLayout}
        numColumns={3}
        // $FlowFixMe
        renderItem={this.renderItem}
        horizontal={false}
      />
    </View>
  );

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
          data={items}
          ListEmptyComponent={this.renderEmptyState}
          ListFooterComponent={this.renderFooter}
          // $FlowFixMe
          onRefresh={this.fetchItems}
          refreshing={isLoading}
          renderItem={this.renderDropGrid}
        />
      </View>
    );
  }

  _keyExtractorDrop = (item): string => item.uuid;

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

export default connect(mapStateToProps)(DropsGridComponent);

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
  dateStrings: {
    color: colors.black,
    paddingHorizontal: 20,
    fontSize: 18,
  },
});
