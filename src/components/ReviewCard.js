// @flow

import React, { PureComponent } from 'react';

import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import StarRating from 'react-native-star-rating';
import { Body, ListItem } from 'native-base';

import colors from '../config/colors';
import * as ui from '../utils/ui';

import type { Order, UserData } from '../types';

const { width } = Dimensions.get('window');

type Props = {
  as: string,
  order: Order,
  onPress: (reviewer: UserData) => void,
};

class ReviewCard extends PureComponent<Props> {
  render() {
    const { order } = this.props;

    let reviewer, review;

    if (this.props.as === 'seller') {
      reviewer = order.seller;
      review = order.reviewFromBuyer;
    } else {
      reviewer = order.buyer;
      review = order.reviewFromSeller;
    }

    const uri = order.product.photoURIs[0].replace('.jpg', '-thumb.jpg');

    const heightContainer =
      review && review.text && review.text.length > 30 ? 20 : 0;

    return (
      // FIXME: upgrade native-base
      <ListItem style={{ marginLeft: 0 }}>
        <View style={{ height: width / 4 + heightContainer }}>
          <Image
            style={[styles.itemImage, { width: width / 4, height: width / 4 }]}
            source={{ uri }}
          />
        </View>
        <Body>
          <View style={styles.contentRow}>
            <Text numberOfLines={1}>
              {order.priceOfItem} {order.currency}
            </Text>
            {review ? (
              <Text numberOfLines={1}>{ui.formatTime(review.createdAt)}</Text>
            ) : (
              <Text numberOfLines={1}>{ui.formatTime(order.finalisedAt)}</Text>
            )}
          </View>
          <View style={styles.contentRow}>
            {review && (
              <StarRating
                // eslint-disable-next-line
                buttonStyle={{ paddingHorizontal: 1.7 }}
                // eslint-disable-next-line
                // containerStyle={{ alignSelf: 'center' }}
                disabled
                emptyStar={
                  Platform.OS == 'ios' ? 'ios-star-outline' : 'md-star-outline'
                }
                emptyStarColor={colors.black}
                fullStar={Platform.OS == 'ios' ? 'ios-star' : 'md-star'}
                fullStarColor={colors.black}
                iconSet="Ionicons"
                rating={review.rateNumber}
                starSize={20}
              />
            )}
            <TouchableOpacity onPress={() => this.props.onPress(reviewer)}>
              <Text style={styles.username} numberOfLines={1}>
                @{reviewer.username}
              </Text>
            </TouchableOpacity>
          </View>
          {review && (
            <Text style={styles.reviewText} numberOfLines={3}>
              {review.text}
            </Text>
          )}
          <Text numberOfLines={1}>
            {order.citySender}-{order.cityRecipient}
          </Text>
        </Body>
      </ListItem>
    );
  }
}

export default ReviewCard;

const styles = StyleSheet.create({
  itemImage: {
    marginHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey4,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  username: {
    color: colors.grey1,
  },
  reviewText: {
    flex: 1,
    // textAlignVertical: 'bottom', // android
    paddingBottom: 5,
  },
});
