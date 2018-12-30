// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActionSheet, Button, List } from 'native-base';
import Icon from 'react-native-vector-icons/Feather';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';

import { Avatar, Countdown } from '../components';

import type { NavigationScreenProp } from 'react-navigation';
import type { Drop, Product, ReduxState, UserData } from '../types';

import * as ui from '../utils/ui';
import * as api from '../utils/api';
import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';

const { width } = Dimensions.get('window');

type Props = {
  amITheSeller: boolean,
  isAdmin: boolean,
  item: Drop,
  navigation: NavigationScreenProp<*>,
  onSubscribeUnsubscribed: ?Function,
  token: string,
};

class DropCard extends Component<Props> {
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
            transparent
            bordered={drop.amISubscribed}
            small
            full
            style={[
              styles.subscribeButton,
              drop.amISubscribed && { backgroundColor: colors.bgDefault },
            ]}
            onPress={() =>
              onSubscribeUnsubscribed && onSubscribeUnsubscribed(drop)
            }>
            <Text
              // eslint-disable-next-line
              style={[
                {
                  fontSize: typography.font_button_size,
                },
                drop.amISubscribed
                  ? { color: colors.grey1, marginTop: -1 }
                  : { color: colors.white },
              ]}>
              {drop.amISubscribed
                ? I18n.t('drops_feed.unsubscribe')
                : I18n.t('drops_feed.subscribe')}
            </Text>
          </Button>
        )}
      </View>
    );
  };

  async deleteDrop(uuid: string) {
    const { token } = this.props;
    try {
      await api.del(`/api/v2/drops/${uuid}`, { token });
    } catch (error) {
      console.error(error);
    }
  }

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

  goToProfile = (user: UserData) => {
    this.props.navigation.navigate({
      routeName: 'profileInStack',
      params: user,
      key: `profile-${user.username}`,
    });
  };

  render() {
    const { isAdmin, item: drop } = this.props;

    // const scheduledAt = new Date('2018-12-30T18:50:24.714Z');
    const scheduledAt = new Date(drop.scheduledAt);

    const willDropIn15Mins = differenceInMinutes(scheduledAt, new Date()) < 16;

    return (
      <>
        <List style={styles.dropHeaderAndFooter}>
          <TouchableOpacity
            style={styles.dropUserRow}
            onPress={() => this.goToProfile(drop.seller)}>
            <Avatar
              size={'verySmall'}
              uri={drop.seller.profilePic}
              placeholderText={drop.seller.username}
            />
            <Text style={styles.userName}>{drop.seller.username}</Text>
          </TouchableOpacity>
          {willDropIn15Mins ? (
            <Countdown
              size={14}
              until={differenceInSeconds(scheduledAt, new Date())}
            />
          ) : (
            <Text style={styles.dateStrings}>
              {format(scheduledAt, 'D MMM HH:mm')}
            </Text>
          )}
          {isAdmin && (
            <Icon
              style={{ paddingRight: 5, paddingTop: 5 }}
              name="trash-2"
              size={22}
              onPress={() => this.onDeleteDrop(drop.uuid)}
            />
          )}
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

const mapStateToProps: any = (state: ReduxState) => ({
  isAdmin: state.LoginReducer.isAdmin,
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default withNavigation(connect(mapStateToProps)(DropCard));

const MARGIN = 1;

const styles = StyleSheet.create({
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: 0,
  },
  subscribeButton: {
    paddingHorizontal: 10,
    backgroundColor: colors.active,
    borderColor: colors.greyOutline,
    borderRadius: 5,
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
