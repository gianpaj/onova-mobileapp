// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  Image,
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
  Icon,
  Left,
  ListItem,
  Right,
} from 'native-base';
import { Toast } from 'antd-mobile-rn';
import StarRating from 'react-native-star-rating';

import { Avatar, Header, Title } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';
import type { Order, UserData, ReduxState } from '../types';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  isLoading: boolean,
  showModal: boolean,
  order: Order,
  buyer: User,
};

export class ConfirmOrderContainer extends Component<Props, State> {
  state = {
    isLoading: true,
    showModal: false,
    order: null,
    buyer: null,
  };

  async componentDidMount() {
    const { token } = this.props;

    const params = this.props.navigation.state.params;
    // for development
    let orderId = '5bceeb77d9777b1b05089c9f';

    if (params) {
      orderId = params.id;
    }

    try {
      const order: Order = await api.getOrder(orderId, token);
      const buyer: Order = await api.getUser(order.buyer._id);
      console.debug(order);
      // const iAmTheSeller = _id.toString() === order.seller._id.toString();

      this.setState({ isLoading: false, order, buyer });
    } catch (err) {
      console.log(err);
      Toast.fail(err.message, 5);
      // this.goBackAndRefresh();
    }
  }

  onConfirm = async () => {
    const { order } = this.state;
    const { token } = this.props;

    let body = {
      orderId: order.id,
    };
    try {
      const { data } = await api.post(
        `/api/users/${this.props.userData._id}/reviews`,
        body,
        {
          token,
        }
      );
      console.debug(data);
      Toast.success(
        "Awesome let's continue and get you the tracking number!",
        5
      );
      this.goBackAndRefresh();
    } catch (err) {
      Toast.fail(err.message, 3);
      console.log(err);
    }
  };

  goBackAndRefresh() {
    this.props.navigation.state.params.shouldRefresh(true);
    this.props.navigation.goBack();
  }

  goToProfile = (user: UserData) => {
    let routeName = 'profileInStack';
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
  };

  goToProduct = (item: Product) => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'product',
      key: `product-${item.uuid}`,
      params: item,
    });
  };

  render() {
    const { isLoading, order, buyer } = this.state;
    if (isLoading || !order) return null;

    const uri = order.product.photoURIs[0].replace('.jpg', '-thumb.jpg');
    const { shippingAddress: buyerInfo } = order.buyer;

    const rateAvg =
      buyer.ratingsTotal !== 0
        ? buyer.ratingsTotal / buyer.reviewsCount
        : buyer.ratingsTotal;

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
          <Body style={[styles.container, { flex: 4 }]}>
            <Title>{I18n.t('confirm_order.header')}</Title>
          </Body>
          <Right />
        </Header>
        <Content>
          <ListItem style={{ marginLeft: 0, paddingTop: 0, paddingBottom: 0 }}>
            <TouchableOpacity
              onPress={() => this.goToProduct(order.product)}
              style={{ height: width / 5 }}>
              <Image
                style={[
                  styles.itemImage,
                  {
                    width: width / 5,
                    height: width / 5,
                  },
                ]}
                source={{ uri }}
              />
            </TouchableOpacity>
            <Body>
              <Text style={styles.price}>
                {order.priceOfItem} {order.currency}
              </Text>
            </Body>
          </ListItem>
          <View
            style={{
              padding: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Avatar
              onPress={() => this.goToProfile(buyer)}
              uri={buyer.profilePic}
              style={{ margin: 10 }}
            />
            <View
              style={{
                padding: 5,
                alignItems: 'center',
                flexDirection: 'row',
              }}>
              <StarRating
                // eslint-disable-next-line
                containerStyle={{
                  justifyContent: 'space-between',
                  width: 108,
                }}
                // disabled={isLoading}
                emptyStar="md-star-outline"
                emptyStarColor={colors.black}
                fullStar="md-star"
                fullStarColor={colors.black}
                iconSet="Ionicons"
                maxStars={5}
                rating={parseInt(rateAvg)}
                starSize={25}
              />
              <Text>({buyer.reviewsCount})</Text>
            </View>
            <TouchableOpacity
              onPress={() => this.goToProfile(buyer)}
              style={{
                alignItems: 'center',
              }}>
              <Text style={styles.name}>
                {buyerInfo.firstName} {buyerInfo.lastName}
              </Text>
            </TouchableOpacity>
            <Text numberOfLines={2} style={styles.messageText}>
              {I18n.t('confirm_order.buying_item_text')}
            </Text>
            <View
              style={{
                marginTop: 5,
                flexDirection: 'row',
              }}>
              <Button
                block
                dark
                style={{
                  marginTop: 15,
                  marginHorizontal: 15,
                  width: widthButtons,
                }}
                onPress={this.onConfirm}>
                <Text style={styles.buttonText}>
                  {I18n.t('confirm_order.confirm')}
                </Text>
              </Button>
              <Button
                light
                block
                style={{
                  marginTop: 15,
                  width: widthButtons,
                }}
                onPress={this.onCancel}>
                <Text style={[styles.buttonText, { color: colors.black }]}>
                  {I18n.t('alerts.action_button_cancel')}
                </Text>
              </Button>
            </View>
          </View>
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

export const ConfirmOrder = connect(mapStateToProps)(ConfirmOrderContainer);

const isUkraian = I18n.locale === 'uk-UA';

const widthButtons = isUkraian ? 120 : 100;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
  },
  itemImage: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey4,
  },
  price: {
    alignSelf: 'center',
    fontSize: typography.font_body_size,
  },
  messageText: {
    paddingTop: 30,
    paddingBottom: 10,
    fontSize: typography.font_body_size * 1.5,
  },
  buttonText: {
    fontSize: typography.font_button_size,
    color: colors.white,
  },
});
