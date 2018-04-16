// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { TextareaItem } from 'antd-mobile';
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
};

export class AddReviewContainer extends Component<Props, State> {
  state = {
    imageHeight: 0,
    rateNumber: 1,
    text: '',
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
        username: 'seller',
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

  componentWillMount() {
    // TODO: check if we have already reviewed this order

    Image.getSize(this.props.order.product.photoURIs[0], (w, h) => {
      this.setState({ imageHeight: Math.floor(h * (width / 4 / w)) });
    });
  }

  onChangeText = (text: string) => this.setState({ text });

  onRate = async (rateNumber: number) => {
    const { text } = this.state;
    const { order } = this.props;
    const { token } = this.props.userData;
    this.setState({ rateNumber });
    console.log(rateNumber);
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
      console.warn(data);
      this.props.navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  render() {
    const { order, userData } = this.props;

    const iAmTheSeller = userData._id.toString() == order.seller._id.toString();

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
            <TouchableOpacity onPress={() => alert('yo')}>
              <Image
                resizeMode="contain"
                style={[
                  styles.item,
                  { width: width / 4, height: this.state.imageHeight },
                ]}
                source={{ uri: order.product.photoURIs[0] }}
              />
            </TouchableOpacity>
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
              uri={
                iAmTheSeller ? order.buyer.profilePic : order.seller.profilePic
              }
              placeholderText={
                iAmTheSeller ? order.buyer.username : order.seller.username
              }
            />
            <TextareaItem
              // editable={!this.state.pending}
              style={styles.textInputContainer}
              rows={3}
              count={settings.MAX_LENGTH_REVIEW}
              onChangeText={this.onChangeText}
              placeholder="Please review your experience (optional)"
              value={this.state.text}
              // error={
              //   this.state.text.trim().length <
              //   settings.MIN_LENGTH_REVIEW
              // }
            />
          </View>
        </Content>
        <Footer>
          <StarRating
            // eslint-disable-next-line
            buttonStyle={{ paddingHorizontal: 5 }}
            // eslint-disable-next-line
            containerStyle={{ alignSelf: 'center' }}
            disabled={false}
            emptyStar={
              Platform.OS == 'ios' ? 'ios-star-outline' : 'md-star-outline'
            }
            emptyStarColor={colors.yellow}
            fullStar={Platform.OS == 'ios' ? 'ios-star' : 'md-star'}
            fullStarColor={colors.yellow}
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
    marginTop: 20,
  },
});
