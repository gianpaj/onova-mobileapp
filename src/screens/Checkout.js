// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  StyleSheet,
  // Platform,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  H1,
  Icon as NBIcon,
  Left,
  Footer,
  FooterTab,
  Right,
  Title,
} from 'native-base';
import { Toast } from 'antd-mobile-rn';
// import { FormInput, FormLabel } from 'react-native-elements';
import type { NavigationScreenProp } from 'react-navigation';
// import { CardView, LiteCreditCardInput } from 'react-native-credit-card-input';
// import BTClient from 'react-native-braintree-xplat';
import update from 'immutability-helper';
import axios from 'axios';
import type { CancelTokenSource } from 'axios';

import { disableRefresh, getPersonalUserData } from '../actions/actionCreator';

import { Accordion, Header, HR } from '../components';

import colors from '../config/colors';
// import settings from '../config/settings';
import { validShippingAddress } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type {
  UserData,
  Dispatch,
  PaymentInfo,
  Product,
  Order,
  ShippingAddress,
  ReduxState,
} from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  shouldRefresh?: boolean,
  token: string,
  userData: UserData,
};

type State = {
  isLoading: boolean,
  item: Product | {},
  order: Order | {},
  paymentInfo: PaymentInfo,
  pending: boolean,
  shippingAddress: ?ShippingAddress,
};

class CheckoutContainer extends Component<Props, State> {
  inputs = [];
  cancelToken: CancelTokenSource;
  state = {
    isLoading: true,
    item: {},
    order: {},
    paymentInfo: {},
    pending: false,
    shippingAddress: null,
  };

  componentDidMount() {
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    this.props.dispatch(
      getPersonalUserData({ cancelToken: this.cancelToken.token })
    );

    this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        this.refresh();
        this.props.dispatch(disableRefresh());
      }
    });

    const { token } = this.props;
    let { params: item } = this.props.navigation.state;
    console.log(item);

    // for development
    if (!item) {
      item = {
        _id: '5b67489ec8a64827b95e4292',
        seller: {
          username: 'iosuser',
          _id: '5acdbcfb570a687a50318881',
        },
        price: '11111',
        uuid: 'rkwjO64B7',
        status: 'forsale',
        currency: 'UAH',
      };
    }

    return api
      .createOrder(item.uuid, token)
      .then((order: Order) => {
        this.setState({
          item,
          isLoading: false,
          order,
        });

        // if (Platform.OS === 'ios') {
        //   BTClient.setupWithURLScheme(
        //     settings.BRAINTREE_TOKENIZATION_KEY,
        //     'com.onova.app.payments'
        //   );
        // } else {
        //   BTClient.setup(settings.BRAINTREE_TOKENIZATION_KEY);
        // }
      })
      .catch(err => {
        console.log(err);
        if (
          err.message == 'Duplicate order' &&
          err.data && // deepscan-disable-line
          err.data.data && // deepscan-disable-line
          err.data.data.status == 'paid'
        ) {
          // $FlowFixMe
          this.goToChat(err.data.data.id, item);
        } else if (err.data.data.status == 'pending') {
          console.log('pending');
          this.setState({
            item,
            isLoading: false,
            order: err.data.data,
          });
          // if (Platform.OS === 'ios') {
          //   BTClient.setupWithURLScheme(
          //     settings.BRAINTREE_TOKENIZATION_KEY,
          //     'com.onova.app.payments'
          //   );
          // } else {
          //   BTClient.setup(settings.BRAINTREE_TOKENIZATION_KEY);
          // }
        } else {
          console.error(err);
        }
      });
  }

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');

    //TODO: unreserve product and cancel order
  }

  handleFocus(ref) {
    this.setState({
      nextFocusDisabled: ref === 7,
      previousFocusDisabled: ref === 5,
      activeInputRef: ref,
    });
  }


  UNSAFE_componentWillReceiveProps(nextProps) {
    console.log('UNSAFE_componentWillReceiveProps');
    const { shippingAddress } = nextProps.userData;
    this.setState({ shippingAddress });
  }

  onCheckout = async () => {
    const { item, order } = this.state;
    // TODO: temp
    const SKIP_PAY = false;
    if (SKIP_PAY && item) {
      console.log(order);
      console.warn('payment skipped');
      // $FlowFixMe
      return this.goToChat(order.id, item);
    }

    const { paymentInfo } = this.state;
    const data = {};

    Toast.loading('Loading...', 3);
    this.setState({ pending: true });

    if (paymentInfo.valid !== undefined) {
      const { values } = paymentInfo;

      data.last_four = values.number.slice(-4);
      data.exp_month = values.expiry.split('/')[0];
      data.exp_year = values.expiry.split('/')[0];
    }

    console.log(data);

    await this.updateShippingInfo();

    Toast.hide();
    this.setState({ pending: false });
    // TODO: send payment request to API

    // TODO: show success Toast
    // this.goToChat(order.id, item);
  };

  updateShippingInfo(): Promise<any> {
    const { userData, token } = this.props;
    const { shippingAddress } = this.state;
    const data = {};
    // if (validShippingAddress(shippingAddress)) {
    data.shippingAddress = shippingAddress;
    // }
    return api
      .put(`/api/users/${userData._id}`, data, { token })
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.debug(err);
        ui.showToast(err.message, 'danger');
      });
  }

  goToChat(orderId: string, item: Product) {
    // $FlowFixMe
    this.props.navigation.dispatch({
      key: `chat-${item.uuid}`,
      type: 'ReplaceCurrentScreen',
      routeName: 'chat',
      params: {
        orderId: orderId,
        productUuid: item.uuid,
        roomId: -1,
        userId: item.seller.id,
      },
    });
  }

  // cancelOrder(): Promise<any> {
  //   const { token } = this.props;
  //   return new Promise((resolve, reject) => {
  //     api
  //       .put(
  //         `/api/orders/${this.state.order.id}`,
  //         { status: 'cancelled' },
  //         { token }
  //       )
  //       .then(res => {
  //         console.debug('order cancelled');
  //         resolve(res.data);
  //       })
  //       .catch(err => {
  //         reject(err);
  //       });
  //   });
  // }

  formatCardInfo() {
    const { paymentInfo }: { paymentInfo: PaymentInfo } = this.props.userData;

    return {
      number: `**** **** **** ${paymentInfo.last_four}`,
      expiry: '',
      name: ' ',
      scale: 0.5,
    };
  }

  onCancel = () => {
    this.props.navigation.goBack();
    // this.cancelOrder().then(co => {
    // });
  isDisabled = () => {
    const { pending, shippingAddress } = this.state;
    const { paymentInfo } = this.props.userData;
    if (
      !pending &&
      paymentInfo.last_four &&
      paymentInfo.method &&
      shippingAddress.line1 &&
      shippingAddress.city
    ) {
      return false;
    }
    return true;
  };

  render() {
    // const { userData } = this.props;
    const { pending, shippingAddress, item, isLoading } = this.state;

    return (
      <Container>
        <Header>
          <Left>
            <NBButton transparent dark onPress={this.onCancel}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body>
            <Title>Checkout</Title>
          </Body>
          <Right />
        </Header>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <View style={styles.flex1}>
            <Content>
              <View style={[styles.padder]}>
                <View style={styles.priceContainer}>
                  {/* $FlowFixMe */}
                  <H1>{item.price}</H1>
                  {/* $FlowFixMe */}
                  <Text>{item.currency}</Text>
                </View>
                <Text style={styles.priceTransaction}>
                  (including x transaction fee)
                </Text>
              </View>
              <HR full />
              <Accordion
                headerText="Shipping Address:"
                values={[
                  {
                    content: [
                      {
                        ref: el => {
                          this.inputs[0] = el;
                        },
                        placeholder: 'Address line 1',
                        value: shippingAddress.line1,
                        onFocus: this.handleFocus.bind(this, 0),
                        onChangeValue: t =>
                          this.setState(
                            update(this.state, {
                              shippingAddress: { line1: { $set: t } },
                            })
                          ),
                      },
                      {
                        ref: el => {
                          this.inputs[1] = el;
                        },
                        placeholder: 'Address line 2',
                        value: shippingAddress.line2,
                        onFocus: this.handleFocus.bind(this, 1),
                        onChangeValue: t =>
                          this.setState(
                            update(this.state, {
                              shippingAddress: { line2: { $set: t } },
                            })
                          ),
                      },
                      {
                        ref: el => {
                          this.inputs[2] = el;
                        },
                        placeholder: 'City',
                        value: shippingAddress.city,
                        onFocus: this.handleFocus.bind(this, 2),
                        onChangeValue: t =>
                          this.setState(
                            update(this.state, {
                              shippingAddress: { city: { $set: t } },
                            })
                          ),
                      },
                      {
                        ref: el => {
                          this.inputs[3] = el;
                        },
                        placeholder: 'State',
                        value: shippingAddress.state,
                        onFocus: this.handleFocus.bind(this, 3),
                        onChangeValue: t =>
                          this.setState(
                            update(this.state, {
                              shippingAddress: { state: { $set: t } },
                            })
                          ),
                      },
                    ],
                  },
                ]}
              />
              <HR full />
            </Content>
            <Footer>
              <FooterTab>
                <NBButton
                  disabled={this.isDisabled()}
                  dark={!this.isDisabled()}
                  onPress={this.onCheckout}
                  full>
                  <Text style={styles.payButtonText}>Make Payment</Text>
                </NBButton>
              </FooterTab>
            </Footer>
          </View>
        )}
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  payButtonText: {
    color: colors.white,
  },
  // label: {
  //   color: colors.black,
  //   fontWeight: '600',
  // },
  // input: {
  //   color: colors.black,
  //   width: '100%',
  // },
  padder: {
    padding: 10,
  },
  priceContainer: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  priceTransaction: {
    color: colors.grey2,
    alignSelf: 'center',
  },
  // inputContainer: {
  //   borderBottomWidth: 0,
  //   marginVertical: 10,
  // },
  // centerText: {
  //   color: colors.grey4,
  //   paddingVertical: 10,
  // },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
  shouldRefresh: state.RefresherReducer.shouldRefresh,
});

export const Checkout = connect(mapStateToProps)(CheckoutContainer);
