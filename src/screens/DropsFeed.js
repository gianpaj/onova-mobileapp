// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Icon as NBIcon,
  Left,
  Right,
  Title,
} from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Header, DropCard } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import * as api from '../utils/api';

import type { NavigationScreenProp } from 'react-navigation';
import type { Drop, ReduxState, Product, UserData } from '../types';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NavigationScreenProp<*>,
  token?: string,
};

type State = {
  hasError: boolean,
  isLoading: boolean,
  isRefreshing: boolean,
  items: Array<Drop>,
};

class DropsFeed extends Component<Props, State> {
  state = {
    hasError: false,
    isLoading: false,
    isRefreshing: false,
    items: [],
  };

  componentDidMount() {
    this.fetchItems();
  }

  /**
   * used when pulling and refreshing AND initially
   */
  fetchItems = async () => {
    this.setState({ isLoading: true });
    const { token } = this.props;

    try {
      const { data } = await api.get('/api/feed/drops', { token });

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

  // eslint-disable-next-line react/no-unused-prop-types
  renderItem = ({ item }: { item: Product }) => {
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
    return (
      <View style={styles.imageContainer} key={item._id}>
        <Image style={styles.image} source={{ uri }} />
      </View>
    );
  };

  renderEmptyState = () => {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, { height: height - 150 }]}>
          <Text style={styles.centerText}>{I18n.t('drops_feed.error')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <>
          <MaterialCommunityIcons
            size={48}
            name="clock"
            color={colors.grey2}
            style={styles.emptyStateIcon}
          />
          <Text style={styles.boldText}>
            {I18n.t('drops_feed.empty_state_title')}
          </Text>
          <Text style={styles.centerText}>
            {I18n.t('drops_feed.empty_state_message')}
          </Text>
        </>
      </View>
    );
  };

  goToProfile = (user: UserData) => {
    this.props.navigation.navigate({
      routeName: 'profileInStack',
      params: user,
      key: `profile-${user.username}`,
    });
  };

  renderSeparator = () => <View style={styles.separator} />;

  _keyDropExtractor = (item): string => item._id;

  renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );

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

    return (
      <View style={styles.flex1}>
        <Header>
          <Left style={styles.container}>
            <NBButton
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>
              {I18n.t('drops_feed.header')}
            </Title>
          </Body>
          <Right />
        </Header>
        {!hasError && isLoading ? (
          this.renderLoading()
        ) : (
          <FlatList
            data={items}
            ListEmptyComponent={this.renderEmptyState}
            ItemSeparatorComponent={this.renderSeparator}
            keyExtractor={this._keyDropExtractor}
            // $FlowFixMe
            onRefresh={this.fetchItems}
            refreshing={isLoading}
            renderItem={props => (
              <DropCard
                goToProfile={this.goToProfile}
                onSubscribeUnsubscribed={this.onSubscribeUnsubscribed}
                {...props}
              />
            )}
          />
        )}
      </View>
    );
  }
}

const MARGIN = 1;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
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
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  boldText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(DropsFeed);
