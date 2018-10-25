// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  H1,
  H3,
  Icon as NBIcon,
  Left,
  Footer,
  FooterTab,
  Right,
  Title,
} from 'native-base';
import { Toast, InputItem } from 'antd-mobile-rn';
import { FormLabel } from 'react-native-elements';
import type { NavigationScreenProp } from 'react-navigation';
// import BTClient from 'react-native-braintree-xplat';
import { KeyboardAccessoryNavigation } from 'react-native-keyboard-accessory';
import update from 'immutability-helper';
import axios from 'axios';
import type { CancelTokenSource } from 'axios';

import { disableRefresh, getPersonalUserData } from '../actions/actionCreator';

import {
  Accordion,
  CardView,
  Header,
  HR,
  SearchableDropdown,
} from '../components';

import colors from '../config/colors';
// import settings from '../config/settings';
import { isPhoneNumberValid, validShippingAddress } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';

import type {
  City,
  Department,
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
  cvc: string,
  cities: Array<City>,
  departments: Array<Department>,
  isLoading: boolean,
  item: Product | {},
  mobileNumber: string,
  order: Order | {},
  paymentInfo: PaymentInfo,
  pending: boolean,
  shippingAddress: ?ShippingAddress,
  showFooter: boolean,
};

export class CheckoutContainer extends Component<Props, State> {
  inputs = [];
  cancelToken: CancelTokenSource;
  state = {
    cvc: '',
    cities: null,
    departments: null,
    isLoading: true,
    item: {},
    mobileNumber: '',
    order: {},
    paymentInfo: {},
    pending: false,
    query: '',
    shippingAddress: null,
    showFooter: true,
  };

  async componentDidMount() {
    this.refresh();
    this.initializeListeners();

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
        uuid: 'ZnE96_uds',
        status: 'forsale',
        currency: 'UAH',
      };
    }
    await this.initialilizeOrder(item);

    const cities = await api.getCities(this.props.token);
    this.setState({ cities });

    if (this.state.shippingAddress && this.state.shippingAddress.city) {
      const departments = await api.getDepartments(
        this.state.shippingAddress.city
      );
      this.setState({ departments });
    }
    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    // cancel order when going back with Backbutton
    this.onCancel();
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');
  }

  initialilizeOrder(item) {
    const { token } = this.props;
    return api
      .createOrder(item.uuid, token)
      .then((order: Order) => {
        this.setState({
          item,
          order,
        });
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
        } else if (
          err.data.data.status == 'pending' ||
          err.data.data.status == 'cancelled'
        ) {
          console.log('order is: pending or cancelled');
          this.setState({
            item,
            order: err.data.data,
          });
        } else {
          console.error(err);
        }
      });
  }

  initializeListeners() {
    this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        this.refresh();
        this.props.dispatch(disableRefresh());
      }
    });

    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide
    );
  }

  _keyboardDidShow = () => this.setState({ showFooter: false });

  _keyboardDidHide = () => this.setState({ showFooter: true });

  refresh = () => {
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    this.props.dispatch(
      getPersonalUserData({ cancelToken: this.cancelToken.token })
    );
  };

  handleFocus(ref) {
    this.setState({
      activeInputRef: ref,
      previousFocusDisabled: ref === 0,
      nextFocusDisabled: ref === 4,
    });
  }

  changeInputFocus(direction = 1) {
    if (
      (this.state.nextFocusDisabled && direction === 1) ||
      (this.state.previousFocusDisabled && direction === -1)
    ) {
      return;
    }

    const focusingRef = this.state.activeInputRef + direction;
    this.inputs[focusingRef] && this.inputs[focusingRef].focus();
  }

  static getDerivedStateFromProps(props, state) {
    if (state.isLoading) {
      return {
        shippingAddress: props.userData.shippingAddress,
        mobileNumber: props.userData.mobileNumber,
      };
    }

    // Return null to indicate no change to state.
    return null;
  }

  onCheckout = async () => {
    const { shippingAddress } = this.state;
    const { paymentInfo } = this.props.userData;
    if (this.canMakePayment()) {
      let missing;
      if (!paymentInfo.last_four || !paymentInfo.method) {
        missing = 'Payment information';
      }
      if (!shippingAddress.departmentNovaposhta || !shippingAddress.city) {
        missing = 'Shipping address';
      }
      return ui.showToast(`${missing} is missing`, 'warning', null, 5);
    }
    const { item, order, cvc } = this.state;
    // TODO: temp
    const SKIP_PAY = false;
    if (SKIP_PAY && item) {
      console.log(order);
      console.warn('payment skipped');
      // $FlowFixMe
      return this.goToChat(order.id, item);
    }

    // const data = {};

    Toast.loading('Loading...', 3);
    this.setState({ pending: true });

    // console.log(data);

    await this.updateShippingInfo();

    Toast.hide();
    this.goToPay(order.id, cvc);

    // this.setState({ pending: false });
    // TODO: send payment request to API

    // TODO: show success Toast
    // this.goToChat(order.id, item);
  };

  updateShippingInfo(): Promise<any> {
    const { userData, token } = this.props;
    const { mobileNumber, shippingAddress } = this.state;
    const data = { shippingAddress };

    // FIXME: state should be the number unformatted. useful also when comparing if number has been changed
    data.mobileNumber = mobileNumber.replace(/\D/g, '');

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
        orderId,
        productUuid: item.uuid,
        roomId: -1,
        userId: item.seller.id,
      },
    });
  }

  cancelOrder(): Promise<any> {
    const { token } = this.props;
    return new Promise((resolve, reject) => {
      api
        .put(
          `/api/orders/${this.state.order.id}`,
          { status: 'cancelled' },
          { token }
        )
        .then(() => {
          console.debug('order cancelled');
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  formatCardInfo() {
    return {
      number: `**** **** **** ${this.props.userData.paymentInfo.last_four}`,
      expiry: '',
      name: ' ',
      scale: 0.5,
    };
  }

  onCancel = async () => {
    try {
      await this.cancelOrder();
      this.props.navigation.goBack();
    } catch (error) {
      ui.showToast(error.message, 'danger');
    }
  };

  goToEnterPaymentInfo = async () => {
    await this.updateShippingInfo();
    this.props.navigation.navigate({
      routeName: 'getCardId',
      key: 'getCardId',
    });
  };

  goToPay = async (orderId: string, cvc: string) => {
    this.props.navigation.navigate({
      routeName: 'paymentView',
      key: 'paymentView',
      params: { orderId, cvc },
    });
  };

  canMakePayment = () => {
    const {
      cities,
      departments,
      mobileNumber,
      pending,
      shippingAddress,
      cvc,
    } = this.state;
    const { paymentInfo } = this.props.userData;
    if (
      !pending &&
      paymentInfo.last_four &&
      paymentInfo.method &&
      cvc.length === 3 &&
      // TODO: only be able to select from the list of cities
      validShippingAddress(shippingAddress, cities, departments) &&
      isPhoneNumberValid(mobileNumber)
    ) {
      return false;
    }
    return true;
  };

  _renderCityAutocomplete = props => {
    const { cities } = this.state;

    return (
      <SearchableDropdown
        onItemSelect={async ({ id }) => {
          if (!id) this.setState({ departments: [] });
          else {
            // TODO: Automatically focus on Deparment field
            // try {
            // } catch (error) {
            //   throw new Error(error);
            // }
            const departments = await api.getDepartments(id);
            this.setState({ departments });
          }

          this.setState(
            update(this.state, {
              shippingAddress: { city: { $set: id } },
            })
          );
        }}
        itemsContainerStyle={styles.autocompleteItemContainers}
        itemStyle={styles.autocompleteItems}
        // TODO: color in red if !cities.indexOf(query)
        inputContainerStyle={styles.autocompleteContainers}
        items={cities}
        regexToMatch={/[\u0400-\u04FF]+/}
        {...props}
      />
    );
  };

  _renderDepartmentAutocomplete = props => {
    const { shippingAddress, departments, cities } = this.state;

    const city = cities.find(city => city.id === shippingAddress.city);
    return (
      <SearchableDropdown
        onItemSelect={({ id }) =>
          this.setState(
            update(this.state, {
              shippingAddress: { departmentNovaposhta: { $set: id } },
            })
          )
        }
        disabled={!departments}
        // TODO: color in red if !department.indexOf(query)
        inputContainerStyle={styles.autocompleteContainers}
        itemsContainerStyle={styles.autocompleteItemContainers}
        itemStyle={styles.autocompleteItems}
        items={departments}
        extra={!city && <Text>Pick a city</Text>}
        {...props}
      />
    );
  };

  renderPricingContainer() {
    const { item, order } = this.state;

    return (
      <View style={styles.pricesContainer}>
        <View style={styles.row}>
          {/* $FlowFixMe */}
          <Text style={{ color: colors.black }}>Total: </Text>
          <View style={styles.innerRow}>
            <H1>{ui.formatCurrency(order.total)} </H1>
            {/* $FlowFixMe */}
            <Text>{item.currency}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text>Item: </Text>
          <View style={styles.innerRow}>
            <H3>{ui.formatCurrency(order.priceOfItem)} </H3>
            <Text>{item.currency}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text>Fees: </Text>
          <View style={styles.innerRow}>
            <H3>{ui.formatCurrency(order.transactionFee)} </H3>
            <Text>{item.currency}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text>Shipping cost: </Text>
          <View style={styles.innerRow}>
            <H3>{ui.formatCurrency(order.shippingFee)} </H3>
            <Text>{item.currency}</Text>
          </View>
        </View>
        {/* <Text style={styles.priceTransaction}>
        (including x transaction fee)
      </Text> */}
      </View>
    );
  }

  changeCVC = (t: string) => {
    if (t.length <= 3) this.setState({ cvc: t.replace(/\D/g, '') });
  };

  render() {
    const { userData } = this.props;
    const {
      cvc,
      cities,
      departments,
      isLoading,
      mobileNumber,
      pending,
      shippingAddress,
      showFooter,
    } = this.state;

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
          <>
            <Content>
              {this.renderPricingContainer()}
              <HR full />
              <Accordion
                expanded
                headerText="Shipping Address:"
                values={[
                  {
                    ref: el => (this.inputs[0] = el),
                    placeholder: 'First name',
                    value: shippingAddress.firstName,
                    onFocus: this.handleFocus.bind(this, 0),
                    onChangeText: t =>
                      this.setState(
                        update(this.state, {
                          shippingAddress: { firstName: { $set: t } },
                        })
                      ),
                    textContentType: 'givenName',
                    error: !shippingAddress.firstName,
                  },
                  {
                    ref: el => (this.inputs[1] = el),
                    placeholder: 'Last name',
                    value: shippingAddress.lastName,
                    onFocus: this.handleFocus.bind(this, 1),
                    onChangeText: t =>
                      this.setState(
                        update(this.state, {
                          shippingAddress: { lastName: { $set: t } },
                        })
                      ),
                    textContentType: 'familyName',
                    error: !shippingAddress.lastName,
                  },
                  {
                    // ref: el => (this.inputs[2] = el),
                    placeholder: 'City',
                    value: cities.find(
                      city => city.id === shippingAddress.city
                    ),
                    // onFocus: this.handleFocus.bind(this, 2),
                    // textContentType: 'addressCity',
                    error: !shippingAddress.city,
                    render: this._renderCityAutocomplete,
                  },
                  {
                    // ref: el => (this.inputs[3] = el),
                    placeholder: 'Novaposhta department',
                    value:
                      departments &&
                      departments.find(
                        d => d.id === shippingAddress.departmentNovaposhta
                      ),
                    // onFocus: this.handleFocus.bind(this, 3),
                    error: !shippingAddress.departmentNovaposhta,
                    render: this._renderDepartmentAutocomplete,
                  },
                  {
                    ref: el => (this.inputs[4] = el),
                    placeholder: '09712344569 Mobile number',
                    value: ui.formatPhoneNumber(mobileNumber),
                    onFocus: this.handleFocus.bind(this, 4),
                    onChangeText: t => this.setState({ mobileNumber: t }),
                    type: 'phone',
                    validation: () =>
                      isPhoneNumberValid(mobileNumber.replace(/\D/g, '')),
                    textContentType: 'telephoneNumber',
                  },
                ]}
              />
              <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>
                Payment Info:
              </FormLabel>
              <View style={{ alignSelf: 'center', paddingBottom: 10 }}>
                <TouchableOpacity onPress={this.goToEnterPaymentInfo}>
                  {Object.keys(userData.paymentInfo).length ? (
                    <CardView focused="number" {...this.formatCardInfo()} />
                  ) : (
                    <CardView {...this.formatCardInfo()} number="" expiry="" />
                  )}
                </TouchableOpacity>
                <InputItem
                  autoCorrect={false}
                  error={cvc.length !== 3}
                  last
                  onChange={this.changeCVC}
                  placeholder="CVC"
                  type="number"
                  value={cvc}
                  // onFocus={this.handleFocus.bind(this, 4)}
                />
              </View>
            </Content>
            {showFooter && (
              <Footer>
                <FooterTab>
                  <NBButton
                    testID="payButton"
                    dark={!this.canMakePayment()}
                    style={[
                      this.canMakePayment() && {
                        backgroundColor: colors.grey4,
                      },
                    ]}
                    onPress={this.onCheckout}
                    full>
                    <Text
                      style={[!this.canMakePayment() && styles.payButtonText]}>
                      Make Payment
                    </Text>
                  </NBButton>
                </FooterTab>
              </Footer>
            )}
          </>
        )}
        {Platform.OS === 'ios' && (
          <KeyboardAccessoryNavigation
            nextDisabled={this.state.nextFocusDisabled}
            previousDisabled={this.state.previousFocusDisabled}
            onNext={this.changeInputFocus.bind(this, 1)}
            onPrevious={this.changeInputFocus.bind(this, -1)}
          />
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
  payButtonText: {
    color: colors.white,
  },
  label: {
    color: colors.black,
    fontWeight: '600',
  },
  pricesContainer: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    padding: 10,
  },
  row: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  innerRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minWidth: 180,
  },
  autocompleteItemContainers: {
    // top: -30,
    // backgroundColor: colors.white,
    // zIndex: 10,
    alignSelf: 'center',
    borderColor: colors.grey4,
    borderWidth: 1,
    borderRadius: 2,
    width: 323,
  },
  autocompleteItems: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginTop: 2,
    marginHorizontal: 10,
    // backgroundColor: colors.grey6,
  },
  autocompleteContainers: {
    borderBottomWidth: 0,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
  shouldRefresh: state.RefresherReducer.shouldRefresh,
});

export const Checkout = connect(mapStateToProps)(CheckoutContainer);
