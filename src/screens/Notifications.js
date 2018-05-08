// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
import { withNavigation } from 'react-navigation';

import { Avatar, Header } from '../components';
import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type {
  UserData,
  Dispatch,
  Notification,
  ReduxState,
  Product,
} from '../types';

import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  data: Array<Notification>,
  isRefreshing: boolean,
  lastId: string,
};

class NotificationsContainer extends Component<Props, State> {
  state = {
    data: [],
    isRefreshing: false,
    lastId: '',
  };

  async componentWillMount() {
    try {
      await this.getNotificationsAndSetState();
    } catch (err) {
      console.error(err);
    }
  }

  async getNotificationsAndSetState(): Promise<any> {
    const { token } = this.props.userData;

    const res = await api.get('/api/users/notifications', { token });

    let lastNotifId = '';
    if (res.data.length > 0) lastNotifId = res.data[res.data.length - 1]._id;
    this.setState({ data: res.data, lastId: lastNotifId });
  }

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  renderEmptyState = () => {
    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.container}>
        <Text>You do not have any notifications</Text>
      </View>
    );
  };

  loadMore = async () => {
    this.setState({ isRefreshing: true });
    const { token } = this.props.userData;
    const res = await api.get(
      `/api/users/notifications?lastId=${this.state.lastId}`,
      {
        token,
      }
    );
    this.setState({ isRefreshing: false });
    if (res.data.length == 0) return;

    const lastNotif = res.data[res.data.length - 1];

    this.setState({
      data: [...this.state.data, ...res.data],
      lastId: lastNotif._id,
    });
  };

  renderFooter = () => {
    if (this.state.lastId == '') return null;

    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.container}>
        <Button full light onPress={this.loadMore}>
          <Text>Load more</Text>
        </Button>
      </View>
    );
  };

  goToProfile = (user: UserData) => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'profile',
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

  refreshNotifications = () => {
    this.setState({ isRefreshing: true });
    this.getNotificationsAndSetState()
      .catch(err => {
        console.debug(err);
        // this.setState({ hasError: true });
      })
      .then(() => this.setState({ isRefreshing: false }));
  };

  _renderItem = ({ item }: { item: Notification }) => {
    return (
      // <ListItem style={{ marginLeft: 0, marginRight: -10 }}>
      <ListItem
        button
        underlayColor={colors.red}
        style={{ marginLeft: 0 }}
        onPress={() => {
          if (item.triggeredType == 'User') this.goToProfile(item.sourceUser);
          if (item.triggeredType == 'Product')
            this.goToProduct(item.triggeredBy);
          // if (item.triggeredType == 'Order')
          //   this.goToChat(item.triggeredBy);
        }}>
        {item.sourceUser && (
          <Avatar
            size={'small'}
            style={{ marginHorizontal: 10 }}
            uri={item.sourceUser.profilePic}
            placeholderText={item.data.senderName}
            // onButtonPress={() =>
            //   this.onFollowOrUnfollow(user._id, user.amIAFollower)
            // }
          />
        )}
        <Body>
          <View style={styles.contentRow}>
            <Text
              style={styles.name}
              numberOfLines={1} // android
            >
              @{item.data.senderName}
            </Text>
          </View>
          <Text
            style={styles.reviewText}
            numberOfLines={3} // android
          >
            {item.notifI18n}
            {/* for comment notifications */}
            {item.triggeredType == 'Product' &&
              item.triggeredBy &&
              ': ' + item.data.text}
          </Text>
        </Body>
        <Right style={{ height: '100%' }}>
          <Text
            numberOfLines={1} // android
          >
            {ui.formatTime(item.dateCreated)}
          </Text>
          <IconEL size={28} name="chevron-right" color={colors.grey4} />
        </Right>
        {/* </TouchableHighlight> */}
      </ListItem>
    );
  };

  render() {
    return (
      <Container>
        <Header style={{ backgroundColor: colors.bgDefault }}>
          <Left style={styles.container}>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>Notifications</Title>
          </Body>
          <Right />
        </Header>
        <FlatList
          data={this.state.data}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
          ListFooterComponent={this.renderFooter}
          renderItem={this._renderItem}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshNotifications}
            />
          }
          style={styles.root}
        />
      </Container>
    );
  }
}

// Inject dispatch and userData
const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
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
    backgroundColor: colors.bgDefault,
    height: '100%',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey6,
  },

  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    color: colors.grey1,
    fontWeight: '800',
    width: '55%',
  },
  reviewText: {
    flex: 1,
    textAlignVertical: 'bottom', // android
    paddingBottom: 5,
  },
});
