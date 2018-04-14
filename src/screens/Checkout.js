// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  StyleSheet,
  Platform,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  H1,
  Header,
  Icon as NBIcon,
  Left,
  Footer,
  FooterTab,
  Right,
  Title,
} from 'native-base';
// import { FormInput, FormLabel } from 'react-native-elements';
import type { NavigationScreenProp } from 'react-navigation';
// import { CardView, LiteCreditCardInput } from 'react-native-credit-card-input';
// import BTClient from 'react-native-braintree-xplat';
import axios from 'axios';
import type { CancelTokenSource } from 'axios';

import { Accordion, HR } from '../components';

import colors from '../config/colors';
// import settings from '../config/settings';
import { validShippingAddress } from '../utils/validators';
import * as api from '../utils/api';
// import * as ui from '../utils/ui';

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
  userData: UserData,
};

type State = {
  emailAddress: string,
  isLoading: boolean,
  item: Product | {},
  order: Order | {},
  password: string,
  paymentInfo: PaymentInfo,
  pending: boolean,
  shippingAddress: ShippingAddress | {},
  username: string,
  usernameError: boolean,
};

class CheckoutContainer extends Component<Props, State> {
  cancelToken: CancelTokenSource;
  state = {
    emailAddress: '',
    isLoading: false,
    item: {},
    order: {},
    password: '',
    paymentInfo: {},
    pending: false,
    shippingAddress: {},
    username: '',
    usernameError: false,
  };

  componentWillMount() {
    this.setState({ isLoading: true });
    this.cancelToken = axios.CancelToken.source();
    // this.props.dispatch(
    //   getPersonalUserData(this.props.userData._id, {
    //     cancelToken: this.cancelToken.token,
    //   })
    // );

    let { params: item } = this.props.navigation.state;
    console.log(item);

    // for development
    if (!item) {
      item = {
        seller: {
          username: 'firstperson',
          id: '5a78d09d2d314a702698f955',
        },
        price: '30',
        uuid: 'SJewilLU8z',
        status: 'forsale',
        currency: 'UAH',
      };
    }

    this.createOrder(item.uuid)
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
          err.data.order &&
          // @TODO: set to 'paid' once payment is completed
          err.data.order.status == 'pending'
        ) {
          // $FlowFixMe
          return this.goToOrderThread(err.data.order.id, item);
        }
        // @TODO: set to 'pending' once payment is completed
        if (err.data.order.status == '@TODO') {
          this.setState({
            item,
            isLoading: false,
            order: err.data.order,
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

    //@TODO: unreserve product and cancel order
  }

  componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;
  }

  onCheckout = () => {
    const { item, order } = this.state;
    // @TODO: temp
    const SKIP_PAY = true;
    if (SKIP_PAY && item) {
      console.log(order);
      console.warn('payment skipped');
      // $FlowFixMe
      return this.goToOrderThread(order.id, item);
    }

    const self = this;
    const { userData } = this.props;
    const { emailAddress, paymentInfo, shippingAddress, username } = this.state;
    const data = {};

    this.setState({ pending: true });

    if (username !== '') {
      data.username = username;
    }

    if (emailAddress !== userData.emailAddress) {
      data.emailAddress = emailAddress;
    }

    if (paymentInfo.valid !== undefined) {
      const { values } = paymentInfo;

      data.last_four = values.number.slice(-4);
      data.exp_month = values.expiry.split('/')[0];
      data.exp_year = values.expiry.split('/')[0];
    }

    if (validShippingAddress(shippingAddress)) {
      data.shippingAddress = shippingAddress;
    }

    console.log(data);

    // Toast.loading('Loading...', 3);

    // BTClient.showPayPalViewController()
    //   // BTClient.showPaymentViewController(options)
    //   .then(nonce => {
    //     // @TODO: payment succeeded, pass nonce to server
    //     console.warn(nonce);
    //   })
    //   .then(() => {
    //     const { order, item } = self.state;
    //     console.log(order);
    // $FlowFixMe
    this.goToOrderThread(order.id, item);
    //   })
    //   .catch(err => {
    //     if (err == 'USER_CANCELLATION' || err == null) {
    //       return;
    //     }
    //     console.error(err);
    //   });

    // api
    //   .put(`/api/users/${userData._id}`, data)
    //   .then(res => {
    //     console.log(res);
    //     // if we changed the email
    //     if (data.emailAddress) {
    //       ui.showToast(
    //         'The new email address requires to be valided. Please check your inbox',
    //         'success'
    //       );
    //     } else {
    //       ui.showToast('Your settings have been updated', 'success');
    //     }
    //     this.props.navigation && this.props.navigation.goBack();
    //   })
    //   .catch(err => {
    //     console.debug(err);
    //     ui.showToast(err.message, 'danger');
    //   })
    //   .then(() => {
    //     // final
    //     Toast.hide();
    //     this.setState({ pending: false });
    //   });
  };

  goToOrderThread(orderId: string, item: Product) {
    // $FlowFixMe
    this.props.navigation.dispatch({
      key: `orderThread-${item.uuid}`,
      type: 'ReplaceCurrentScreen',
      routeName: 'orderThread',
      params: {
        productId: item.uuid,
        orderId: orderId,
        userId: item.seller.id,
      },
    });
  }

  createOrder(uuid: string): Promise<Order> {
    const { token } = this.props.userData;
    return new Promise((resolve, reject) => {
      api
        .post('/api/orders', { product: uuid }, { token })
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  // cancelOrder(): Promise<any> {
  //   const { token } = this.props.userData;
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

  onCCChange = form => {
    this.setState({
      paymentInfo: {
        valid: form.valid,
        values: form.values,
      },
    });
  };

  formatCardInfo() {
    const { paymentInfo } = this.props.userData;

    return {
      number: `**** **** **** ${paymentInfo.last_four}`,
      expiry: `${paymentInfo.exp_month} / ${paymentInfo.exp_year}`,
      name: ' ',
    };
  }

  shouldComponentUpdate(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) {
      return false;
    }
    return true;
  }

  onCancel = () => {
    this.props.navigation.goBack();
    // this.cancelOrder().then(co => {
    // });
  };

  render() {
    // const { userData } = this.props;
    const { pending, shippingAddress, item, isLoading } = this.state;

    return (
      <Container>
        <Header>
          <Left>
            <NBButton transparent dark onPress={() => this.onCancel()}>
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
            <Content style={{ backgroundColor: colors.white }}>
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
              <View style={styles.padder}>
                <Text>asd</Text>
              </View>
              <HR full />
            </Content>
            <Footer>
              <FooterTab>
                <NBButton
                  onPress={this.onCheckout}
                  full
                  style={styles.buyButtonContainer}>
                  <Text style={styles.buyButtonText}>Make Payment</Text>
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
  buyButtonContainer: {
    backgroundColor: colors.primary,
  },
  buyButtonText: {
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
});

export const Checkout = connect(mapStateToProps)(CheckoutContainer);
