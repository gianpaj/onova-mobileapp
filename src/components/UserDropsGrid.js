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
import { ActionSheet, List } from 'native-base';
import Icon from 'react-native-vector-icons/Feather';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';

import { Countdown } from '../components';

import type { NavigationScreenProp } from 'react-navigation';

import { disableRefresh } from '../actions/actionCreator';
import type { Dispatch, Schedule, Product } from '../types';

import I18n from '../i18n';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import typography from '../config/typography';
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

  getItemLayout(data: any, index: number) {
    const itemHeight = width / 3;
    return { length: itemHeight, offset: itemHeight * index, index };
  }

  renderItem = ({ item }: { item: Product }) => {
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
    return (
      <View style={styles.imageContainer} key={item._id}>
        <Image style={styles.image} source={{ uri }} />
      </View>
    );
  };

  onDeleteDrop(uuid: string) {
    const DELETE = 'Delete? (only admin can see the icon)';
    const CANCEL = I18n.t('alerts.action_button_cancel');

    const BUTTONS = [DELETE, CANCEL];
    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: 0,
        cancelButtonIndex: BUTTONS.indexOf(CANCEL),
      },
      buttonIndex => {
        if (0 === buttonIndex) {
          ui.showConfirmAlert('Confirm deleting the drop?', '', () => {
            this.deleteDrop(uuid);
          });
        }
      }
    );
  }

  async deleteDrop(uuid: string) {
    const { token } = this.props;
    try {
      await api.del(`/api/v2/drops/${uuid}`, { token });
      this.fetchItems();
    } catch (error) {
      console.error(error);
    }
  }

  renderDropGrid = ({ item }: any) => {
    const scheduledAt = new Date(item.scheduledAt);

    const willDropIn15Mins = differenceInMinutes(scheduledAt, new Date()) < 16;
    return (
      <>
        <List
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          {willDropIn15Mins ? (
            <Countdown
              size={14}
              until={differenceInSeconds(scheduledAt, new Date())}
            />
          ) : (
            <Text style={styles.dateStrings}>
              {format(item.scheduledAt, 'D MMM HH:mm')}
            </Text>
          )}
          {this.props.isAdmin && (
            <Icon
              style={{ paddingRight: 5, paddingTop: 5 }}
              name="trash-2"
              size={22}
              onPress={() => this.onDeleteDrop(item.uuid)}
            />
          )}
        </List>
        <FlatList
          data={item.products}
          columnWrapperStyle={[styles.columnWrapper, { height: width / 3 }]}
          keyExtractor={this._keyProductExtractor}
          getItemLayout={this.getItemLayout}
          numColumns={3}
          // $FlowFixMe
          renderItem={this.renderItem}
          horizontal={false}
        />
      </>
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
          data={items}
          ListEmptyComponent={this.renderEmptyState}
          ListFooterComponent={this.renderFooter}
          // $FlowFixMe
          onRefresh={this.fetchItems}
          refreshing={isLoading}
          renderItem={this.renderDropGrid}
          ItemSeparatorComponent={this.renderSeparator}
          keyExtractor={this._keyDropExtractor}
        />
      </View>
    );
  }

  renderSeparator = () => <View style={styles.separator} />;

  _keyProductExtractor = (item): string => item._id;
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
  dateStrings: {
    color: colors.black,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: typography.font_body_size,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },
});
