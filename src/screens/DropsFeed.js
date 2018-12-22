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
  List,
  Right,
  Title,
} from 'native-base';
import { format } from 'date-fns';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Header, Avatar } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';
import * as api from '../utils/api';

import type { NavigationScreenProp } from 'react-navigation';
import type { Drop, ReduxState, Product } from '../types';

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
   * used when pulling and refreshing AND when initially
   */
  fetchItems = async () => {
    this.setState({ isLoading: true });
    const { token } = this.props;
    console.log(token);

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
          <MaterialCommunityIcons // or SVG?
            size={48}
            name="clock"
            color={colors.grey2}
            style={styles.emptyStateIcon}
          />
          <Text style={styles.boldText}>
            {I18n.t('drops_grid.empty_state_title')}
          </Text>
          <Text style={styles.centerText}>
            {I18n.t('drops_grid.empty_state_message_mine')}
          </Text>
        </>
      </View>
    );
  };

  renderDropGrid = ({ item }: any) => (
    <>
      <List style={styles.dropHeader}>
        <View style={styles.dropUserRow}>
          <Avatar
            size={'verySmall'}
            // style={styles.avatarContainer}
            uri={item.seller.profilePic}
            placeholderText={item.seller.username}
          />
          <Text style={styles.userName}>{item.seller.username}</Text>
        </View>
        <Text style={styles.dateStrings}>
          {format(item.scheduledAt, 'D MMM HH:mm')}
        </Text>
      </List>
      <FlatList
        data={item.products}
        columnWrapperStyle={[styles.columnWrapper, { height: width / 3 }]}
        keyExtractor={this._keyProductExtractor}
        getItemLayout={this.getItemLayout}
        numColumns={3}
        renderItem={this.renderItem}
        horizontal={false}
      />
    </>
  );

  renderSeparator = () => <View style={styles.separator} />;

  _keyProductExtractor = (item): string => item._id;
  _keyDropExtractor = (item): string => item._id;

  renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );

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
            // $FlowFixMe
            onRefresh={this.fetchItems}
            refreshing={isLoading}
            keyExtractor={this._keyDropExtractor}
            renderItem={this.renderDropGrid}
            ItemSeparatorComponent={this.renderSeparator}
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
  dropUserRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userName: {
    paddingLeft: 10,
  },
  dropHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  dateStrings: {
    // justifyContent: 'flex-end',
    color: colors.black,
    fontSize: typography.font_body_size,
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
  avatarContainer: {
    marginHorizontal: 10,
    top: -10,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(DropsFeed);
