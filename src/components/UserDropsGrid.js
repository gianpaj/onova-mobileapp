// @flow

import * as React from 'react';
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

import type { NavigationScreenProp } from 'react-navigation';

import { DropCard } from '../components';

import { disableRefresh } from '../actions/actionCreator';
import type { Dispatch, Drop, Schedule, Product, UserData } from '../types';

import I18n from '../i18n';
import * as api from '../utils/api';
import colors from '../config/colors';

type Props = {
  dispatch: Dispatch,
  emptyState: React.Node,
  focused: boolean,
  isAdmin: boolean,
  navigation?: NavigationScreenProp<*>,
  shouldRefresh?: boolean,
  token?: string,
  username: string,
  userData: UserData,
};

type State = {
  hasError: boolean,
  isLoading: boolean,
  isRefreshing: boolean,
  items: Array<Schedule>,
};

const { width, height } = Dimensions.get('window');

class UserDropsGridComponent extends React.PureComponent<Props, State> {
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
      const { data } = await api.get(`/api/v2/drops/?username=${username}`, {
        token,
      });

      //#region development
      /*
      const data = [
        {
          posted: false,
          products: [
            {
              photoURIs: [
                'https://assets.onova.co/products/8LOvCz1MR-1-1546028852413.jpg',
              ],
              _id: '5c2687346657400c3ff4567b',
            },
          ],
          status: 'valid',
          _id: '5c2687346657400c3ff4567a',
          scheduledAt: '2018-12-28T20:48:56.891Z',
          seller: {
            shippingAddress: {
              firstName: 'Олександр',
              lastName: 'Костінський ',
              city: 'db5c88f5-391c-11dd-90d9-001a92567626',
              departmentNovaposhta: '39931b85-e1c2-11e3-8c4a-0050568002cf',
            },
            accountStatus: 'verified',
            _id: '5afaa93daeeb1453812fc011',
            username: 'alex',
            profilePic:
              'http://assets.onova.co/users/5afaa93daeeb1453812fc011-1526385408286.jpg',
            displayName: 'Alex',
          },
          createdAt: '2018-12-28T20:27:32.932Z',
          updatedAt: '2018-12-28T20:27:32.932Z',
          uuid: 'yAyE262fS',
        },
      ];
      */
      //#endregion

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

  renderItem = ({ item }: { item: Product }) => {
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
    return (
      <View style={styles.imageContainer} key={item._id}>
        <Image style={styles.image} source={{ uri }} />
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

  onSubscribeUnsubscribed = async (drop: Drop) => {
    const { token } = this.props;
    try {
      if (drop.amISubscribed) {
        await api.post(`/api/v2/drops/${drop.uuid}/unsubscribe`, null, {
          token,
        });
      } else {
        await api.post(`/api/v2/drops/${drop.uuid}/subscribe`, null, {
          token,
        });
      }
      this.fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    const { hasError, isLoading, items } = this.state;
    const { username, userData } = this.props;

    if (this.firstFocus) return null;

    if (!hasError && isLoading) return this.renderLoading();

    const amITheSeller = userData.username === username;

    return (
      <View style={styles.container}>
        <FlatList
          data={items}
          ListEmptyComponent={this.renderEmptyState}
          ListFooterComponent={this.renderFooter}
          ItemSeparatorComponent={this.renderSeparator}
          keyExtractor={this._keyDropExtractor}
          // $FlowFixMe
          onRefresh={this.fetchItems}
          refreshing={isLoading}
          renderItem={props => (
            <DropCard
              amITheSeller={amITheSeller}
              onSubscribeUnsubscribed={this.onSubscribeUnsubscribed}
              {...props}
            />
          )}
        />
      </View>
    );
  }

  renderSeparator = () => <View style={styles.separator} />;

  _keyDropExtractor = (item): string => item._id;

  renderEmptyState = () => {
    if (this.state.items.length > 1) return null;

    if (this.state.hasError) {
      return (
        <View style={[styles.container, { height: height - 150 }]}>
          <Text style={styles.centerText}>{I18n.t('image_grid.error')}</Text>
        </View>
      );
    }

    return this.props.emptyState;
  };

  renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const mapStateToProps = (state: any) => ({
  isAdmin: state.LoginReducer.isAdmin,
  token: state.LoginReducer.token,
  shouldRefresh: state.RefresherReducer.shouldRefresh,
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(UserDropsGridComponent);

const MARGIN = 1;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  centerText: {
    marginTop: 5,
    textAlign: 'center',
  },
  image: {
    flex: 1,
    margin: MARGIN,
    width: (width + MARGIN * 2) / 3,
  },
  imageContainer: {
    alignItems: 'stretch',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
});
