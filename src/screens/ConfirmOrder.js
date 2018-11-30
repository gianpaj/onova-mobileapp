// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  Image,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Body,
  Button,
  Container,
  Icon,
  Left,
  ListItem,
  Right,
} from 'native-base';
import Dialog from 'react-native-dialog';
import { Toast } from 'antd-mobile-rn';
import StarRating from 'react-native-star-rating';
import Foect from 'foect';

import { Avatar, Header, Title } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';
import * as api from '../utils/api';

import type { NavigationScreenProp } from 'react-navigation';
import type { Order, UserData, ReduxState } from '../types';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NavigationScreenProp<*>,
  token: string,
};

type State = {
  isLoading: boolean,
  isPending: boolean,
  dialogVisible: boolean,
  order: Order,
  buyer: User,
};

export class ConfirmOrderContainer extends Component<Props, State> {
  state = {
    isLoading: true,
    isPending: false,
    dialogVisible: false,
    order: null,
    buyer: null,
  };

  async componentDidMount() {
    const { token } = this.props;

    const params = this.props.navigation.state.params;
    // for development
    let orderId = '5bdb16b06a7aef00de9da76b';

    // for prod dev
    // let orderId = '5bf52286186739115fb39e02';

    if (params) {
      orderId = params.id;
    }

    try {
      const order: Order = await api.getOrder(orderId, token);
      if (order.status !== 'paid') {
        console.warn('order.status', order.status);
        throw new Error(`Order has already been ${order.status}`);
      }
      const buyer: Order = await api.getUser(order.buyer._id);
      console.debug(order);
      // const iAmTheSeller = _id.toString() === order.seller._id.toString();

      this.setState({ isLoading: false, order, buyer });
    } catch (err) {
      console.log(err);
      Toast.fail(err.message, 5);
      this.goBackAndRefresh();
    }
  }

  onCancelSubmit = async ({ reason }: { reason: string }) => {
    const { token } = this.props;

    this.setState({ isPending: true });
    try {
      await api.put(
        `/api/orders/${this.state.order.id}`,
        { reason, status: 'cancelled' },
        { token }
      );
      // console.warn('cancelled', this.state.order.id, reason);
      Toast.info('The order has been cancelled');
      this.setState({ dialogVisible: false });
      this.props.navigation.goBack();
    } catch (err) {
      console.log(err);
      this.setState({ dialogVisible: false });
      Toast.fail(err.message, 5);
    }
    this.setState({ isPending: false });
  };

  onConfirm = async () => {
    const { token } = this.props;
    const { order } = this.state;

    Toast.loading('Loading...', 30);

    this.setState({ isPending: true });
    try {
      const { data } = await api.put(
        `/api/orders/${order.id}`,
        { status: 'confirmed' },
        { token }
      );
      console.debug(data);
      Toast.hide();
      Toast.success(
        "Awesome! Let's continue and get you the tracking number",
        5
      );
      this.goToChat(order.id);
    } catch (err) {
      Toast.hide();
      Toast.fail(err.message, 3);
      console.log(err);
      this.setState({ isPending: false });
    }
  };

  goBackAndRefresh() {
    // this.props.navigation.state.params.shouldRefresh(true);
    this.props.navigation.goBack();
  }

  goToChat(orderId: string) {
    // $FlowFixMe
    this.props.navigation.dispatch({
      key: `chat-${orderId}`,
      type: 'ReplaceCurrentScreen',
      routeName: 'chat',
      params: { orderId },
    });
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
    const { isLoading, order, buyer, isPending } = this.state;
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
          <Left style={styles.container}>
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
        <View>
          <ListItem style={styles.itemOnTop}>
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
                {`${ui.formatCurrency(order.priceOfItem, 0)} ${I18n.t(
                  order.currency
                )}`}
              </Text>
            </Body>
          </ListItem>
          <View style={styles.mainContainer}>
            <Avatar
              onPress={() => this.goToProfile(buyer)}
              uri={buyer.profilePic}
              placeholderText={buyer.username}
              style={{ margin: 10 }}
            />
            <View style={[styles.row, { alignItems: 'center' }]}>
              <StarRating
                // eslint-disable-next-line react-native/no-inline-styles
                containerStyle={{
                  justifyContent: 'space-between',
                  width: 108,
                  marginRight: 5,
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
              style={{ alignItems: 'center' }}>
              <Text style={styles.name}>
                {buyerInfo.firstName} {buyerInfo.lastName}
              </Text>
            </TouchableOpacity>
            <Text numberOfLines={2} style={styles.messageText}>
              {I18n.t('confirm_order.buying_item_text')}
            </Text>
            <View style={styles.row}>
              <Button
                block
                dark
                disabled={isPending}
                style={styles.buttonConfirm}
                onPress={this.onConfirm}>
                <Text style={styles.buttonText}>
                  {I18n.t('confirm_order.confirm')}
                </Text>
              </Button>
              <Button
                light
                block
                disabled={isPending}
                style={styles.buttonCancel}
                onPress={this.toggleDialog}>
                <Text style={[styles.buttonText, { color: colors.black }]}>
                  {I18n.t('alerts.action_button_cancel')}
                </Text>
              </Button>
            </View>
          </View>
        </View>
        {this.renderCancelDialog()}
      </Container>
    );
  }

  toggleDialog = () =>
    this.setState(prevState => ({ dialogVisible: !prevState.dialogVisible }));

  renderCancelDialog = () => {
    const { dialogVisible, isPending } = this.state;
    let thisForm;
    return (
      <Dialog.Container
        visible={dialogVisible}
        onBackdropPress={this.toggleDialog}
        onBackButtonPress={this.toggleDialog}>
        <Dialog.Title style={{ color: colors.black }}>
          {I18n.t('confirm_order.dialog_title')}
        </Dialog.Title>
        <Foect.Form onValidSubmit={this.onCancelSubmit}>
          {form => {
            // FIXME: :'(
            thisForm = form;
            return (
              <Foect.Control
                name="reason"
                required
                minLength={10}
                maxLength={300}>
                {control => {
                  const hasError =
                    (control.isTouched || form.isSubmitted) &&
                    control.isInvalid;
                  return (
                    <View>
                      <Dialog.Input
                        autoCorrect
                        onBlur={control.markAsTouched}
                        onChangeText={text => control.onChange(text)}
                        multiline
                        numberOfLines={2}
                        underlineColorAndroid={
                          hasError ? colors.red : colors.black
                        }
                        placeholder={I18n.t('confirm_order.reason_placeholder')}
                        value={control.value}
                      />
                      <Text
                        style={[
                          styles.dialogErrorText,
                          // eslint-disable-next-line react-native/no-inline-styles
                          {
                            display: hasError ? 'flex' : 'none',
                          },
                        ]}>
                        {I18n.t('confirm_order.error_reason_is_mandatory')}
                      </Text>
                    </View>
                  );
                }}
              </Foect.Control>
            );
          }}
        </Foect.Form>
        <Dialog.Button
          disabled={isPending}
          color={Platform.OS === 'ios' ? '#007ff9' : colors.grey2}
          label={I18n.t('alerts.action_button_close')}
          onPress={this.toggleDialog}
        />
        <Dialog.Button
          bold
          disabled={isPending}
          color={colors.red}
          label={I18n.t('confirm_order.button_cancel_order')}
          onPress={() => thisForm.submit()}
        />
      </Dialog.Container>
    );
  };
}

const mapStateToProps: any = (state: ReduxState) => ({
  token: state.LoginReducer.token,
});

export const ConfirmOrder = connect(mapStateToProps)(ConfirmOrderContainer);

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  itemOnTop: {
    marginLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  mainContainer: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
  },
  row: {
    padding: 5,
    flexDirection: 'row',
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
  buttonConfirm: {
    marginTop: 15,
    marginRight: 15,
    paddingHorizontal: 20,
  },
  buttonCancel: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: typography.font_button_size,
    color: colors.white,
  },
  dialogErrorText: {
    marginBottom: 15,
    color: colors.red,
    textAlign: 'center',
  },
});
