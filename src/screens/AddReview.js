// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

import { Header, Title } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';
import type { Order, UserData, ReduxState } from '../types';

// const starIcon = Platform.OS == 'ios' ? 'ios-star' : 'md-star';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  // imageHeight: number,
  isLoading: boolean,
  order: Order,
};

export class AddReviewContainer extends Component<Props, State> {
  state = {
    // imageHeight: 0,
    isLoading: true,
    order: null,
  };

  async componentDidMount() {
    const { token } = this.props;
    const { _id } = this.props.userData;
    const params = this.props.navigation.state.params;
    let { orderId } = params;

    // for development
    if (!params) {
      orderId = '5aeae04049af190a21c80d17';
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
    trackingNumber,
  }: {
    rateNumber: number,
    text: string,
    trackingNumber: number,
  }) => {
    const { order } = this.state;
    const { token } = this.props;

    if (text && text.trim().length < settings.MIN_LENGTH_REVIEW) {
      return;
    }

    let body = {
      orderId: order.id,
      rateNumber,
      lang: 'en',
      trackingNumber,
    };
    if (text) body = { ...body, text };
    try {
      const { data } = await api.post(
        `/api/users/${this.props.userData._id}/reviews`,
        body,
        {
          token,
        }
      );
      console.debug(data);
      Toast.success('Thanks for the review!', 5);
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

  onTrackingInfo() {
    Alert.alert(
      'Tracking number',
      'Please enter the tracking number of Nova Poshta from your package to leave a review. The tracking number is valid only for 7 days after the item has been delivered.'
    );
  }

  render() {
    // const { userData } = this.props;
    const { isLoading, order } = this.state;
    if (isLoading || !order) return null;

    // const iAmTheSeller = userData._id.toString() == order.seller._id.toString();

    // const targetUser = iAmTheSeller ? order.buyer : order.seller;

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
            <Title>{I18n.t('add_review.header')}</Title>
          </Body>
          <Right>
            <Button
              transparent
              dark
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onArchive}>
              <MaterialCommunityIcons
                name="delete"
                size={28}
                color={colors.black}
              />
            </Button>
          </Right>
        </Header>
        <Content>
          <Foect.Form onValidSubmit={this.onRate}>
            {form => (
              <View style={{ padding: 10 }}>
                <View style={{ width: '100%', flexDirection: 'row' }}>
                  <Foect.Control
                    name="trackingNumber"
                    required
                    minLength={14}
                    maxLength={14}>
                    {control => {
                      const hasError =
                        (control.isTouched || form.isSubmitted) &&
                        control.isInvalid;
                      return (
                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <View
                            style={{
                              alignItems: 'center',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              width: widthFields,
                            }}>
                            <Text
                              style={{
                                fontWeight: 'bold',
                                color: colors.black,
                              }}>
                              {I18n.t('add_review.nova_poshta_tracking_num')}
                            </Text>
                            <Button
                              transparent
                              dark
                              style={{ marginLeft: 10 }}
                              onPress={this.onTrackingInfo}>
                              <MaterialCommunityIcons
                                name="information-outline"
                                size={28}
                              />
                            </Button>
                          </View>

                          <TextInput
                            autoCorrect={false}
                            style={{
                              fontSize: typography.font_body_size,
                              width: widthFields,
                              borderBottomWidth: Platform.select({
                                ios: 1,
                                android: 0,
                              }),
                              borderColor: hasError ? colors.red : colors.black,
                            }}
                            onBlur={control.markAsTouched}
                            onChangeText={text =>
                              control.onChange(text.replace(/[^0-9]/g, ''))
                            }
                            underlineColorAndroid={
                              hasError ? colors.red : colors.black
                            }
                            value={control.value}
                            keyboardType="numeric"
                            maxLength={14}
                          />

                          {/* <Text style={{ color: colors.red }}>
                            {hasError
                              ? 'Please enter a valid tracking number.'
                              : ' '}
                          </Text> */}
                        </View>
                      );
                    }}
                  </Foect.Control>
                </View>
                <View style={{ flex: 1, marginTop: 5 }}>
                  <Foect.Control name="text">
                    {control => (
                      <TextareaItem
                        style={styles.textInputContainer}
                        last
                        rows={3}
                        count={settings.MAX_LENGTH_REVIEW}
                        onChangeText={control.onChange}
                        placeholder={I18n.t('add_review.text_placeholder')}
                        value={control.value}
                        error={
                          control.value.length > 0 &&
                          control.value.trim().length <
                            settings.MIN_LENGTH_REVIEW
                        }
                      />
                    )}
                  </Foect.Control>
                  <Foect.Control name="rateNumber" required>
                    {control => (
                      <View>
                        <StarRating
                          // eslint-disable-next-line
                          containerStyle={{
                            alignSelf: 'center',
                            width: widthFields,
                            justifyContent: 'space-between',
                            marginTop: 10,
                          }}
                          // disabled={isLoading}
                          emptyStar="md-star-outline"
                          emptyStarColor={colors.black}
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
                      </View>
                    )}
                  </Foect.Control>
                  <Button
                    block
                    dark
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
              </View>
            )}
          </Foect.Form>
        </Content>
        {/* <Footer /> */}
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
