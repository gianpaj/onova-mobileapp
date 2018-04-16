// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {
  Body,
  Button,
  Container,
  Content,
  Footer,
  Header,
  Icon,
  Left,
  Right,
  Title,
} from 'native-base';
import { TextareaItem, Toast } from 'antd-mobile';
import StarRating from 'react-native-star-rating';

import { Avatar } from '../components/index';

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';

import type { NavigationScreenProp } from 'react-navigation';

import type { Order, UserData, ReduxState } from '../types';

const { width } = Dimensions.get('window');

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  order: Order,
  userData: UserData,
};

type State = {
  imageHeight: number,
  rateNumber: number,
  text: string,
  isDisabled: boolean,
  isLoading: boolean,
};

export class AddReviewContainer extends Component<Props, State> {
  state = {
    imageHeight: 0,
    rateNumber: 0,
    text: '',
    isDisabled: false,
    isLoading: true,
  };

  // for development
  static defaultProps = {
    // TODO: get order details from local API
    // $FlowFixMe
    order: {
      id: '5a90077ff298522a0eddde0a',
      buyer: {
        _id: '5a78d09e2d314a702698f957',
        accountStatus: 'verified',
        id: '5a78d09e2d314a702698f957',
        profilePic:
          'https://storage.googleapis.com/staging.onova-183307.appspot.com/users/5a78d09e2d314a702698f957-1521722787711.jpg',
        username: 'buyer',
      },
      priceOfItem: 99900.59,
      seller: {
        _id: '5a78d09d2d314a702698f955',
        accountStatus: 'verified',
        id: '5a78d09d2d314a702698f955',
        profilePic:
          'https://storage.googleapis.com/staging.onova-183307.appspot.com/users/5a78d09e2d314a702698f957-1521722787711.jpg',
        username: 'firstperson',
      },
      product: {
        categoryIds: [1, 2],
        createdAt: new Date(),
        currency: 'UAH',
        description: 'description',
        price: '30',
        seller: {},
        uuid: 'SJewilLU8z',
        photoURIs: ['http://assets.onova.co/products/B14JwZ3iG-1.jpg'],
      },
      status: 'completed',
    },
  };

  async componentWillMount() {
    // TODO: check if we have already reviewed this order

    const { token, _id } = this.props.userData;
    try {
      const { data }: { data: Order } = await api.get(
        `/api/orders/${this.props.order.id}`,
        {
          token,
        }
      );
      const iAmTheSeller = _id.toString() == data.seller._id.toString();
      const iAmTheBuyer = _id.toString() == data.buyer._id.toString();
      if (
        (data.reviewedBySeller && iAmTheSeller) ||
        (data.reviewedByBuyer && iAmTheBuyer)
      ) {
        throw new Error('You have already left a review');
      }
    } catch (err) {
      // console.error(err);
      this.props.navigation.goBack();
      Toast.fail(err.message, 5);
      return;
    }

    this.setState({ isLoading: false });

    Image.getSize(this.props.order.product.photoURIs[0], (w, h) => {
      this.setState({ imageHeight: Math.floor(h * (width / 4 / w)) });
    });
  }

  onChangeText = (text: string) => {
    if (text.length > 0 && text.trim().length < settings.MIN_LENGTH_REVIEW) {
      this.setState({ isDisabled: true });
    } else {
      this.setState({ isDisabled: false });
    }
    this.setState({ text });
  };

  onRate = async (rateNumber: number) => {
    const { text } = this.state;
    const { order } = this.props;
    const { token } = this.props.userData;

    if (text.length > 0 && text.trim().length < settings.MIN_LENGTH_REVIEW) {
      return;
    }

    this.setState({ rateNumber });
    const body = {
      orderId: order.id,
      rateNumber,
      lang: 'en',
    };
    if (text) body.text = text;
    try {
      const { data } = await api.post(
        `/api/users/${this.props.userData._id}/reviews`,
        body,
        {
          token,
        }
      );
      console.debug(data);
      Toast.success('Thanks for the review', 5);
      this.props.navigation.goBack();
    } catch (err) {
      console.error(err);
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

  render() {
    const { order, userData } = this.props;
    const { text, isDisabled, isLoading } = this.state;
    if (isLoading) return null;

    const iAmTheSeller = userData._id.toString() == order.seller._id.toString();

    const targetUser = iAmTheSeller ? order.buyer : order.seller;

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
          <Right />
        </Header>
        <Content>
          <View style={{ width: '100%', flexDirection: 'row' }}>
            <Image
              resizeMode="contain"
              style={[
                styles.item,
                { width: width / 4, height: this.state.imageHeight },
              ]}
              source={{ uri: order.product.photoURIs[0] }}
            />
            <Text
              style={{
                alignSelf: 'center',
                flex: 1,
                fontSize: 24,
                marginRight: this.state.imageHeight,
                textAlign: 'center',
              }}>
              {order.status == 'completed' && 'collected'}
            </Text>
          </View>
          <View style={{ flex: 1, marginTop: 30 }}>
            <Avatar
              style={{ alignSelf: 'center' }}
              size={'medium'}
              withBorder
              uri={targetUser.profilePic}
              placeholderText={targetUser.username}
              onPress={() => this.goToProfile(targetUser)}
            />
            <TouchableHighlight onPress={() => this.goToProfile(targetUser)}>
              <Text style={{ marginBottom: 20, textAlign: 'center' }}>
                @{targetUser.username}
              </Text>
            </TouchableHighlight>
            <TextareaItem
              autoFocus
              // editable={!this.state.isPending}
              style={styles.textInputContainer}
              rows={3}
              count={settings.MAX_LENGTH_REVIEW}
              onChangeText={this.onChangeText}
              placeholder="Please review your experience (optional)"
              value={text}
              error={
                text.length > 0 &&
                text.trim().length < settings.MIN_LENGTH_REVIEW
              }
            />
          </View>
        </Content>
        <Footer>
          <StarRating
            // eslint-disable-next-line
            buttonStyle={{ paddingHorizontal: 5 }}
            // eslint-disable-next-line
            containerStyle={{ alignSelf: 'center' }}
            disabled={isDisabled}
            emptyStar={
              Platform.OS == 'ios' ? 'ios-star-outline' : 'md-star-outline'
            }
            emptyStarColor={isDisabled ? colors.grey4 : colors.yellow}
            fullStar={Platform.OS == 'ios' ? 'ios-star' : 'md-star'}
            fullStarColor={isDisabled ? colors.grey4 : colors.yellow}
            iconSet="Ionicons"
            maxStars={5}
            rating={this.state.rateNumber}
            selectedStar={this.onRate}
            starSize={50}
          />
        </Footer>
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
});
