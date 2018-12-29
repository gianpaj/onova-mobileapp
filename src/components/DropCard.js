// @flow

import React, { Component } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, List } from 'native-base';
import { format } from 'date-fns';

import { Avatar } from '../components';

import type { Drop, Product, UserData } from '../types';

import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';

const { width } = Dimensions.get('window');

type Props = {
  amITheSeller: boolean,
  item: Drop,
  goToProfile: Function,
  onSubscribeUnsubscribed: ?Function,
};

export default class DropCard extends Component<Props> {
  // eslint-disable-next-line react/no-unused-prop-types
  renderItem = ({ item }: { item: Product }) => {
    const uri = item.photoURIs[0].replace('.jpg', '-thumb.jpg');
    return (
      <View style={styles.imageContainer} key={item._id}>
        <Image style={styles.image} source={{ uri }} />
      </View>
    );
  };

  getItemLayout(data: any, index: number) {
    const itemHeight = width / 3;
    return { length: itemHeight, offset: itemHeight * index, index };
  }

  _keyProductExtractor = (item): string => item._id;

  renderFooter = () => {
    const { item: drop, onSubscribeUnsubscribed, amITheSeller } = this.props;

    return (
      <View
        style={[
          styles.dropHeaderAndFooter,
          // eslint-disable-next-line react-native/no-inline-styles
          amITheSeller ? {} : { justifyContent: 'flex-end' },
        ]}>
        {amITheSeller && (
          <Text>
            {drop.subscribers.length} {I18n.t('drops_feed.subscribers')}
          </Text>
        )}
        {!amITheSeller && (
          <Button
            dark
            style={{ paddingHorizontal: 10 }}
            onPress={onSubscribeUnsubscribed}>
            <Text
              // eslint-disable-next-line
              style={{
                fontSize: typography.font_button_size,
                color: colors.white,
              }}>
              {drop.iSubscribed
                ? I18n.t('drops_feed.unsubscribe')
                : I18n.t('drops_feed.subscribe')}
            </Text>
          </Button>
        )}
      </View>
    );
  };

  render() {
    const { item: drop, goToProfile } = this.props;

    return (
      <>
        <List style={styles.dropHeaderAndFooter}>
          <TouchableOpacity
            style={styles.dropUserRow}
            onPress={() => goToProfile(drop.seller)}>
            <Avatar
              size={'verySmall'}
              uri={drop.seller.profilePic}
              placeholderText={drop.seller.username}
            />
            <Text style={styles.userName}>{drop.seller.username}</Text>
          </TouchableOpacity>
          <Text style={styles.dateStrings}>
            {format(drop.scheduledAt, 'D MMM HH:mm')}
          </Text>
        </List>
        <FlatList
          columnWrapperStyle={[styles.columnWrapper, { height: width / 3 }]}
          data={drop.products}
          getItemLayout={this.getItemLayout}
          horizontal={false}
          keyExtractor={this._keyProductExtractor}
          ListFooterComponent={this.renderFooter}
          numColumns={3}
          renderItem={this.renderItem}
        />
      </>
    );
  }
}

const MARGIN = 1;

const styles = StyleSheet.create({
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
  dropHeaderAndFooter: {
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
});
