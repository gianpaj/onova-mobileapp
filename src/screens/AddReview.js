// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  Body,
  Button,
  Container,
  Content,
  // Footer,
  Icon,
  Left,
  Right,
} from 'native-base';
import { TextareaItem, Toast } from 'antd-mobile-rn';
import StarRating from 'react-native-star-rating';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Foect from 'foect';

import { OrderStatus, Header, Title, Info } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as linking from '../utils/linking';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';
import type { Order, UserData, ReduxState } from '../types';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  // imageHeight: number,
  isLoading: boolean,
  order: ?Order,
};

export class AddReviewContainer extends Component<Props, State> {
  state = {
    // imageHeight: 0,
    isLoading: true,
    order: null,
  };

  async componentDidMount() {
    const { token, userData, navigation } = this.props;
    const { _id } = userData;
    const params = navigation.state.params;
    let orderId;

    // for development
    if (!params) {
      orderId = '5bed82ab61d3476321aa9aac';
    } else {
      orderId = params.orderId;
    }

    try {
      const order: Order = await api.getOrder(orderId, token);
      const iAmTheSeller = _id.toString() === order.seller._id.toString();
      const iAmTheBuyer = _id.toString() === order.buyer._id.toString();
      if (
        (iAmTheSeller && order.archivedBySeller) ||
        (iAmTheBuyer && order.archivedByBuyer)
      ) {
        throw new Error(I18n.t('add_review.toast_msg_archived'));
      }
      if (
        (iAmTheSeller && order.reviewFromSeller) ||
        (iAmTheBuyer && order.reviewFromBuyer)
      ) {
        throw new Error(I18n.t('add_review.toast_msg_reviewed'));
      }
      this.setState({ isLoading: false, order });

      // Image.getSize(order.product.photoURIs[0], (w, h) => {
      //   this.setState({ imageHeight: Math.floor(h * (width / 4 / w)) });
      // });
    } catch (err) {
      console.log(err);
      Toast.fail(err.message, 5);
      this.goBackAndRefresh();
    }
  }

  onRate = async ({
    rateNumber,
    text,
  }: {
    // eslint-disable-next-line react/no-unused-prop-types
    rateNumber: number,
    // eslint-disable-next-line react/no-unused-prop-types
    text: string,
  }) => {
    const { token, userData } = this.props;

    if (text && text.trim().length < settings.MIN_LENGTH_REVIEW) {
      return;
    }

    let body = {
      orderId: this.state.order.id,
      rateNumber,
      lang: I18n.locale.slice(0, 2),
    };
    if (text) body = { ...body, text };
    try {
      const { data } = await api.post(
        `/api/users/${userData._id}/reviews`,
        body,
        { token }
      );
      console.debug(data);
      Toast.success(I18n.t('add_review.success_message'), 5);
      this.goBackAndRefresh();
    } catch (err) {
      Toast.fail(err.message, 3);
      console.log(err);
    }
  };

  onArchive = () => {
    const { token } = this.props;
    ui.showConfirmAlert(
      I18n.t('add_review.alert_confirm_archive'),
      '',
      async () => {
        try {
          await api.put(
            `/api/orders/${this.state.order.id}`,
            { archive: true },
            { token }
          );
          Toast.success(I18n.t('add_review.archived'), 3);
          this.goBackAndRefresh();
        } catch (error) {
          console.error(error);
        }
      }
    );
  };

  goBackAndRefresh() {
    this.props.navigation.state.params.shouldRefresh(true);
    this.props.navigation.goBack();
  }

  render() {
    // const { userData } = this.props;
    const { isLoading, order } = this.state;
    if (isLoading || !order) return null;

    // order.trackingNumber = 20600000076896;

    // const iAmTheSeller = userData._id.toString() == order.seller._id.toString();

    // const targetUser = iAmTheSeller ? order.buyer : order.seller;

    const canLeaveReview = [
      'completed',
      'failed_by_buyer',
      'failed_by_seller',
    ].includes(order.status);

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
          <Body style={styles.flex2AndCenter}>
            <Title
              style={{ color: colors.black, marginLeft: 22, marginRight: 5 }}>
              {I18n.t('add_review.header')}
            </Title>
            <Info
              onPress={linking.openURL.bind(this, 'https://onova.co/drop.html')}
            />
          </Body>
          <Right>
            <Button transparent dark disabled onPress={this.onArchive}>
              <MaterialCommunityIcons
                name="delete"
                size={28}
                color={canLeaveReview ? colors.black : colors.grey4}
              />
            </Button>
          </Right>
        </Header>
        <Content>
          <View
            style={{
              flexDirection: 'row',
              alignSelf: 'center',
              marginTop: 20,
            }}>
            <Text>{I18n.t('add_review.tracking_num_label')} </Text>
            <Text selectable style={{ padding: 10, margin: -10 }}>
              {order.trackingNumber}
            </Text>
          </View>
          <OrderStatus order={order} style={{ marginTop: 30 }} />
          <Foect.Form onValidSubmit={this.onRate}>
            {form => (
              <View style={{ padding: 10, flex: 1, marginTop: 0 }}>
                <Foect.Control name="text">
                  {control => (
                    <TextareaItem
                      editable={canLeaveReview}
                      count={settings.MAX_LENGTH_REVIEW}
                      error={
                        control.value.length > 0 &&
                        control.value.trim().length < settings.MIN_LENGTH_REVIEW
                      }
                      last
                      onChangeText={control.onChange}
                      placeholder={I18n.t('add_review.text_placeholder')}
                      rows={3}
                      style={[
                        styles.textInputContainer,
                        canLeaveReview ? {} : { borderColor: colors.grey4 },
                      ]}
                      value={control.value}
                    />
                  )}
                </Foect.Control>
                <Foect.Control name="rateNumber" required>
                  {control => (
                    <>
                      <StarRating
                        // eslint-disable-next-line
                        containerStyle={{
                          alignSelf: 'center',
                          width: widthFields,
                          justifyContent: 'space-between',
                          marginTop: 10,
                        }}
                        disabled={!canLeaveReview}
                        emptyStar="md-star-outline"
                        emptyStarColor={
                          canLeaveReview ? colors.black : colors.grey4
                        }
                        fullStar="md-star"
                        fullStarColor={colors.black}
                        iconSet="Ionicons"
                        maxStars={5}
                        rating={parseInt(control.value)}
                        selectedStar={control.onChange}
                        starSize={35}
                      />
                      <Text
                        style={{
                          color: colors.red,
                          textAlign: 'center',
                        }}>
                        {form.isSubmitted && control.isInvalid
                          ? I18n.t('add_review.rating_error')
                          : ' '}
                      </Text>
                    </>
                  )}
                </Foect.Control>
                <Button
                  block
                  dark
                  disabled={!canLeaveReview}
                  style={{
                    marginTop: 15,
                    width: widthFields,
                    alignSelf: 'center',
                  }}
                  onPress={() => form.submit()}>
                  <Text style={styles.buttonText}>
                    {I18n.t('add_review.button')}
                  </Text>
                </Button>
              </View>
            )}
          </Foect.Form>
        </Content>
      </Container>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const AddReview = connect(mapStateToProps)(AddReviewContainer);

const widthFields = 280;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  flex2AndCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    flexDirection: 'row',
  },
  textInputContainer: {
    alignSelf: 'center',
    borderBottomWidth: Platform.select({
      ios: 1,
      android: 0,
    }),
    fontSize: typography.font_body_size,
    width: widthFields + 10,
  },
  buttonText: {
    fontSize: 16,
    color: colors.white,
  },
});
