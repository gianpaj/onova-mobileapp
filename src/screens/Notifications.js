// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Button,
  Container,
  Icon,
  Left,
  ListItem,
  Right,
  Title,
} from 'native-base';
import { Icon as IconEL } from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { withNavigation } from 'react-navigation';

import I18n from '../i18n';
import { Avatar, Header } from '../components';
import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

const isiOS = Platform.OS === 'ios';

import type { UserData, Notification, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  data: Array<Notification>,
  isRefreshing: boolean,
  isLoading: boolean,
  lastId: string,
};

class NotificationsContainer extends Component<Props, State> {
  state = {
    data: [],
    isRefreshing: false,
    isLoading: true,
    lastId: '',
  };

  async componentDidMount() {
    try {
      await this.getNotificationsAndSetState();
      this.setState({ isLoading: false });
    } catch (err) {
      console.error(err);
    }
  }

  async getNotificationsAndSetState(): Promise<any> {
    const { token } = this.props;

    const { data } = await api.get('/api/users/notifications', { token });

    let lastNotifId = '';
    if (data.length > 0) lastNotifId = data[data.length - 1]._id;
    this.setState({ data: data, lastId: lastNotifId });
  }

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  renderEmptyState = () => (
    <View style={[styles.container, { alignSelf: 'center', height: 300 }]}>
      <Ionicons
        size={48}
        name={isiOS ? 'ios-notifications' : 'md-notifications'}
        color={colors.grey2}
        style={{ alignSelf: 'center', marginBottom: 30 }}
      />
      <Text>{I18n.t('notifications.empty_state_message')}</Text>
    </View>
  );

  loadMore = async () => {
    const { data, lastId, isRefreshing } = this.state;

    if (isRefreshing) return;

    const lastIdQuery = lastId ? `lastId=${lastId}` : '';

    try {
      this.setState({ isRefreshing: true });
      const { token } = this.props;
      const res = await api.get(`/api/users/notifications?${lastIdQuery}`, {
        token,
      });
      if (res.data.length == 0) {
        return this.setState({ isRefreshing: false, lastId: '' });
      }

      const lastNotif = res.data[res.data.length - 1];

      this.setState({
        data: [...data, ...res.data],
        lastId: lastNotif._id,
      });
    } catch (error) {
      console.error(err);
    }
    this.setState({ isRefreshing: false });
  };

  renderFooter = () => {
    // if there are no items OR there is no lastId
    if (!this.state.data.length || this.state.lastId === '') return null;

    return (
      <View style={styles.container}>
        <Button full light onPress={this.loadMore}>
          <Text>{I18n.t('notifications.load_more_button')}</Text>
        </Button>
      </View>
    );
  };

  goToProfile = (user: UserData) => {
    const { _id } = this.props.userData;
    let routeName = 'profileInStack';
    if (_id == user._id) {
      routeName = 'profile';
    }
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
  };

  goToProduct = (item: Product) => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'product',
      key: `product-${item.uuid}`,
      params: item,
    });
  };

  goToConfirmOrder = (order: Order) => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'confirmOrder',
      key: 'confirmOrder',
      params: order,
    });
  };

  refreshNotifications = () => {
    this.setState({ isRefreshing: true });
    this.getNotificationsAndSetState()
      .catch(err => {
        console.debug(err);
        // this.setState({ hasError: true });
      })
      .then(() => this.setState({ isRefreshing: false }));
  };

  // eslint-disable-next-line react/no-unused-prop-types
  _renderItem = ({ item }: { item: Notification }) => (
    <ListItem
      button
      style={{ marginLeft: 0 }}
      onPress={() => {
        switch (item.triggeredType) {
          case 'User':
            this.goToProfile(item.sourceUser);
            break;
          case 'Product':
            this.goToProduct(item.triggeredBy);
            break;
          case 'Order':
            // or the ConfirmOrder screen should check if it can be confirmed ('paid' and not 'confirmed')
            if (item.data.status === 'paid')
              this.goToConfirmOrder(item.triggeredBy);
            break;
          default:
            break;
        }
      }}>
      {item.sourceUser && ( // deepscan-disable-line
        <Avatar
          size={'verySmall'}
          style={styles.avatarContainer}
          uri={item.sourceUser.profilePic}
          placeholderText={item.sourceUser.username}
        />
      )}
      <Body>
        {/* Paid orders do not have a senderName (for now) */}
        {item.sourceUser && (
          <View style={styles.contentRow}>
            <Text style={styles.name} numberOfLines={1}>
              @{item.sourceUser.username}
            </Text>
          </View>
        )}
        <Text style={styles.reviewText} numberOfLines={3}>
          {item.notifI18n}
          {/* for comment notifications */}
          {item.triggeredType == 'Product' &&
            item.triggeredBy &&
            ': ' + item.data.text}
        </Text>
      </Body>
      <Right>
        <Text style={styles.time} numberOfLines={1}>
          {ui.formatTime(item.dateCreated)}
        </Text>
        <IconEL size={28} name="chevron-right" color={colors.grey4} />
      </Right>
    </ListItem>
  );

  renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );

  render() {
    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>
              {I18n.t('notifications.header')}
            </Title>
          </Body>
          <Right />
        </Header>
        {this.state.isLoading ? (
          this.renderLoading()
        ) : (
          <FlatList
            data={this.state.data}
            ItemSeparatorComponent={this._renderSeparator}
            keyExtractor={this._keyExtractor}
            ListEmptyComponent={this.renderEmptyState}
            ListFooterComponent={this.renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this.refreshNotifications}
              />
            }
            renderItem={this._renderItem}
            style={styles.root}
          />
        )}
      </Container>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const Notifications = withNavigation(
  connect(mapStateToProps)(NotificationsContainer)
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  root: {
    height: '100%',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey6,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  name: {
    color: colors.grey1,
    fontWeight: '800',
    width: '85%',
  },
  avatarContainer: {
    marginHorizontal: 10,
    top: -10,
  },
  time: {
    fontSize: 12,
    color: colors.grey2,
    marginTop: 5,
  },
  reviewText: {
    flex: 1,
    textAlignVertical: 'bottom', // android
    paddingBottom: 0,
  },
});
