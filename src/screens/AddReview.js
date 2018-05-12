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
  Footer,
  Icon,
  Left,
  Right,
  Title,
} from 'native-base';
import { TextareaItem, Toast } from 'antd-mobile';
import StarRating from 'react-native-star-rating';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Foect from 'foect';

import { Header } from '../components/index';

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';
// eslint-disable-next-line
import type { Order, UserData, ReduxState } from '../types';

const starIcon = Platform.OS == 'ios' ? 'ios-star' : 'md-star';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
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

  async componentWillMount() {
    const { token, _id } = this.props.userData;
    let { orderId } = this.props.navigation.state.params;

    if (!orderId) orderId = '5aeae04049af190a21c80d17';

    try {
      const order: Order = await api.getOrder(orderId, token);
      const iAmTheSeller = _id.toString() == order.seller._id.toString();
      const iAmTheBuyer = _id.toString() == order.buyer._id.toString();
      if (
        (iAmTheSeller && order.archivedBySeller) ||
        (iAmTheBuyer && order.archivedByBuyer)
      ) {
        throw new Error('You have already archived this order');
      }
      if (
        (iAmTheSeller && order.reviewedBySeller) ||
        (iAmTheBuyer && order.reviewedByBuyer)
      ) {
        throw new Error('You have already left a review');
      }
      this.setState({ isLoading: false, order });

      // Image.getSize(order.product.photoURIs[0], (w, h) => {
      //   this.setState({ imageHeight: Math.floor(h * (width / 4 / w)) });
      // });
    } catch (err) {
      // console.error(err);
      this.goBackAndRefresh();
      Toast.fail(err.message, 5);
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
    const { token } = this.props.userData;

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

  goToProfile = (user: UserData) => {
    if (!user._id) return;
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'profile',
      params: user,
      key: `profile-${user.username}`,
    });
  };

  onArchive = () => {
    const { token } = this.props.userData;
    ui.showConfirmAlert('Confirm archiving the order?', '', async () => {
      try {
        const o = await api.put(
          `/api/orders/${this.state.order.id}`,
          { archive: true },
          { token }
        );
        Toast.success('Done!', 3);
        this.goBackAndRefresh();
      } catch (error) {
        console.error(error);
      }
    });
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
          <Left>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body>
            <Title>Review</Title>
          </Body>
          <Right>
            <Button
              transparent
              dark
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onArchive}>
              <Ionicons name="md-archive" size={28} color={colors.black} />
            </Button>
          </Right>
        </Header>
        <Content style={{ backgroundColor: colors.bgDefault }}>
          <Foect.Form onValidSubmit={this.onRate}>
            {form => (
              <View style={{ padding: 10 }}>
                <View style={{ width: '100%', flexDirection: 'row' }}>
                  <Foect.Control
                    name="trackingNumber"
                    required
                    minLength={14}
                    maxLength={14}>
                    {control => (
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          <Text>Nova Poshta tracking number:</Text>
                          <Button
                            transparent
                            dark
                            style={{ marginLeft: 10 }}
                            onPress={this.onTrackingInfo}>
                            <Feather name="help-circle" size={28} />
                          </Button>
                        </View>

                        <TextInput
                          style={{
                            height: 40,
                            borderColor: colors.grey4,
                            borderWidth: 1,
                            width: 200,
                          }}
                          onBlur={control.markAsTouched}
                          onChangeText={text =>
                            control.onChange(text.replace(/[^0-9]/g, ''))
                          }
                          value={control.value}
                          keyboardType="numeric"
                          autoCorrect={false}
                          maxLength={14}
                        />

                        <Text style={{ color: colors.red }}>
                          {(control.isTouched || form.isSubmitted) &&
                          control.isInvalid
                            ? 'Please enter a valid tracking number.'
                            : ' '}
                        </Text>
                      </View>
                    )}
                  </Foect.Control>
                </View>
                <View style={{ flex: 1, marginTop: 5 }}>
                  <Foect.Control name="rateNumber" required>
                    {control => (
                      <View>
                        <StarRating
                          // eslint-disable-next-line
                          buttonStyle={{ paddingHorizontal: 5 }}
                          // eslint-disable-next-line
                          containerStyle={{ alignSelf: 'center' }}
                          // disabled={isLoading}
                          emptyStar={starIcon}
                          emptyStarColor={colors.grey4}
                          fullStar={starIcon}
                          fullStarColor={colors.yellow}
                          iconSet="Ionicons"
                          maxStars={5}
                          rating={parseInt(control.value)}
                          selectedStar={rateNumber =>
                            control.onChange(rateNumber)
                          }
                          starSize={50}
                        />
                        <Text
                          style={{
                            color: colors.red,
                            textAlign: 'center',
                          }}>
                          {form.isSubmitted && control.isInvalid
                            ? 'Please select a rating'
                            : ' '}
                        </Text>
                      </View>
                    )}
                  </Foect.Control>
                  <Foect.Control name="text">
                    {control => (
                      <TextareaItem
                        style={styles.textInputContainer}
                        rows={3}
                        count={settings.MAX_LENGTH_REVIEW}
                        onChangeText={t => {
                          // this.onChangeText(t);
                          control.onChange(t);
                        }}
                        placeholder="Please review your experience (optional)"
                        value={control.value}
                        error={
                          control.value.length > 0 &&
                          control.value.trim().length <
                            settings.MIN_LENGTH_REVIEW
                        }
                      />
                    )}
                  </Foect.Control>
                  <Button
                    block
                    dark
                    style={{ marginTop: 15 }}
                    onPress={() => form.submit()}>
                    <Text style={styles.buttonText}>Review</Text>
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
});

export const AddReview = connect(mapStateToProps)(AddReviewContainer);

const styles = StyleSheet.create({
  textInputContainer: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonText: {
    fontSize: 16,
    color: colors.white,
  },
});
