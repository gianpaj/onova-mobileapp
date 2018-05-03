// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {
  Container,
  Header,
  Left,
  Button,
  Icon,
  Title,
  Body,
  ListItem,
  Right,
} from 'native-base';
import { withNavigation } from 'react-navigation';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { UserData, Dispatch, Notification, ReduxState } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  data: Array<Notification>,
  isRefreshing: boolean,
};

export class NotificationsContainer extends Component<Props, State> {
  state = {
    data: [],
    isRefreshing: false,
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

    const res = await api.get(`/api/users/notifications`, {
      token,
    });

    this.setState({ data: res.data });
  }

  _keyExtractor = (item): string => item._id;

  _renderSeparator = () => <View style={styles.separator} />;

  renderEmptyState = () => {
    if (!this.state.showingResults) return null;

    // TODO: center empty state in RN 0.56 - https://github.com/facebook/react-native/pull/18206
    return (
      <View style={styles.container}>
        <Text>You do not have any notifications</Text>
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
      <TouchableHighlight
        underlayColor={colors.grey4}
        onPress={() => this.goToProfile(item.triggeredBy)}>
        <ListItem style={{ marginLeft: 0 }}>
          <Body>
            {/* <View style={styles.contentRow}>
              <Text
                style={styles.name}
                numberOfLines={1} // android
              >
                @{item.data.senderName}
              </Text>
            </View> */}
            <Text
              style={styles.reviewText}
              numberOfLines={3} // android
            >
              {item.notifI18n.replace('${senderName}', item.data.senderName)}
            </Text>
          </Body>
          <Right style={{ height: '100%' }}>
            <Text
              numberOfLines={1} // android
            >
              {ui.formatTime(item.dateCreated)}
            </Text>
          </Right>
        </ListItem>
      </TouchableHighlight>
    );
  };

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body>
            <Title>Notifications</Title>
          </Body>
          <Right />
        </Header>
        <FlatList
          data={this.state.data}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          ListEmptyComponent={this.renderEmptyState}
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
  root: {
    backgroundColor: colors.bgDefault,
    height: '100%',
  },
  flex1: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
  },

  itemImage: {
    marginHorizontal: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey4,
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
