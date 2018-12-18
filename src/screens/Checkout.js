// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  Keyboard,
  Image,
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
  Icon as NBIcon,
  Left,
  Footer,
  FooterTab,
  Right,
  Title,
} from 'native-base';
import { Toast, InputItem } from 'antd-mobile-rn';
import { FormLabel } from 'react-native-elements';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import type { NavigationScreenProp } from 'react-navigation';
// import BTClient from 'react-native-braintree-xplat';
import { KeyboardAccessoryNavigation } from 'react-native-keyboard-accessory';
import update from 'immutability-helper';
import axios from 'axios';
import type { CancelTokenSource } from 'axios';

import {
  disableRefresh,
  enableCancelOrder,
  getPersonalUserData,
} from '../actions/actionCreator';

import {
  Accordion,
  CardView,
  Header,
  HR,
  SearchableDropdown,
} from '../components';

import colors from '../config/colors';
import { isPhoneNumberValid, validShippingAddress } from '../utils/validators';
import * as linking from '../utils/linking';
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
  shouldCancelOrder?: boolean,
  shouldRefresh?: boolean,
  token: string,
  userData: UserData,
};

type State = {
  areFeesLoading: boolean,
  cvc: string,
  cities: ?Array<City>,
  departments: ?Array<Department>,
  isLoading: boolean,
  item: Product | {},
  mobileNumber: string,
  order: Order | {},
  paymentInfo: PaymentInfo,
  pending: boolean,
  seller: ?UserData,
  shippingAddress: ?ShippingAddress,
  shippingFee: string,
  showFooter: boolean,
  nextFocusDisabled: boolean,
  previousFocusDisabled: boolean,
  activeInputRef: number,
};

const cyrillicRegex = /^$|^[\u0400-\u04FF\s]+$/;

class CheckoutContainer extends Component<Props, State> {
  inputs = [];
  cancelToken: CancelTokenSource;
  _scrollView;
  autoCompleteRef;
  keyboardDidShowListener;
  keyboardDidHideListener;

  state = {
    areFeesLoading: false,
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
    seller: null,
    shippingAddress: null,
    shippingFee: '',
    showFooter: true,
    nextFocusDisabled: true,
    previousFocusDisabled: true,
    activeInputRef: -1,
  };

  async componentDidMount() {
    const { token } = this.props;
    let { params: item } = this.props.navigation.state;

    this.refresh();
    this.initializeListeners();

    // for development
    if (!item) {
      item = { uuid: 'kSJn1hKZx' };
      // prod (alex item)
      // item = { uuid: 'GoSdu69xp' };
    }
    console.log(item);

    try {
      await this.initialilizeOrder(item);

      const cities = await api.getCities(token);
      this.setState({ cities });

      const { shippingAddress, order } = this.state;

      if (shippingAddress && shippingAddress.city) {
        const departments = await api.getDepartments(shippingAddress.city);
        if (shippingAddress.departmentNovaposhta && order.id) {
          // console.warn(order);
          const shippingFee = await api.getShippingCosts(
            order.priceOfItem,
            undefined,
            order.id,
            shippingAddress.departmentNovaposhta,
            token
          );
          // console.warn(shippingFee);
          this.setState({ shippingFee });
        }
        this.setState({ departments });
      }
    } catch (error) {
      console.error(error);
      if (error.message.startsWith('Seller is missing')) {
        Toast.fail(error.message);
        return this.props.navigation.goBack();
      }
    }
    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');

    const {
      shippingAddress,
      mobileNumber,
      cities,
      departments,
      order,
    } = this.state;

    // cancel order when going back with Back button but not after successful payment
    if (order.id && this.props.shouldCancelOrder) this.onCancel();
    if (
      isPhoneNumberValid(mobileNumber) &&
      validShippingAddress(shippingAddress, cities, departments)
    ) {
      this.updateShippingInfo();
    }
  }

  initialilizeOrder(item) {
    const { token } = this.props;
    // TODO: refactor this for both a new order and existing. use async/await
    return api
      .createOrder(item.uuid, token)
      .then((order: Order) => {
        // if it's a new order
        this.setState({
          item,
          order,
          shippingFee: order.shippingFee,
        });
        return order;
      })
      .then((order: Order) => api.getUser(order.seller))
      .then((seller: UserData) => this.setState({ seller }))
      .catch(async err => {
        if (err.data && err.data.data) {
          const { data } = err.data;
          if (err.message == 'Duplicate order' && data.status == 'confirmed') {
            // $FlowFixMe
            return this.goToChat(data.id);
          }

          if (data.status == 'pending' || data.status == 'cancelled') {
            console.log('order is: pending or cancelled');
            const seller = await api.getUser(data.seller);
            return this.setState({
              item,
              order: data,
              seller,
              shippingFee: data.shippingFee,
            });
          }
        }
        throw err;
      });
  }

  initializeListeners() {
    this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        this.refresh();
        this.props.dispatch(disableRefresh());
      }
    });
    this.props.dispatch(enableCancelOrder());

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

  handleFocus = (ref: number) =>
    this.setState({
      activeInputRef: ref,
      previousFocusDisabled: ref === 0,
      nextFocusDisabled: ref === 5,
    });

  changeInputFocus(direction: number = 1) {
    if (
      (this.state.nextFocusDisabled && direction === 1) ||
      (this.state.previousFocusDisabled && direction === -1)
    ) {
      return;
    }

    const focusingRef = this.state.activeInputRef + direction;
    this.inputs[focusingRef] && this.inputs[focusingRef].focus();
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.isLoading)
      return {
        shippingAddress: props.userData.shippingAddress,
        mobileNumber: props.userData.mobileNumber,
      };

    // Return null to indicate no change to state.
    return null;
  }

  onCheckout = async () => {
    const { cvc, mobileNumber, order, shippingAddress } = this.state;
    const { paymentInfo } = this.props.userData;

    try {
      // TODO: extract into checkPaymentErrorsOrThrow function
      if (this.canMakePayment()) {
        let missing;
        let error = I18n.t('checkout.error_is_missing');
        if (
          !shippingAddress.departmentNovaposhta ||
          !shippingAddress.city ||
          !shippingAddress.firstName ||
          !shippingAddress.lastName
        ) {
          missing = I18n.t('checkout.missing.shippingAddress');
        } else if (!mobileNumber) {
          missing = I18n.t('checkout.missing.mobileNumber');
          this.inputs[4].focus();
        } else if (!cvc) {
          missing = I18n.t('checkout.missing.cardNumber');
          this.inputs[5].focus();
        } else if (cvc.length !== 3) {
          missing = I18n.t('checkout.missing.cardNumber');
          error = I18n.t('checkout.error_is_not_valid');
          this.inputs[5].focus();
        } else if (!paymentInfo.last_four || !paymentInfo.method) {
          missing = I18n.t('checkout.missing.cardInfo');
        } else if (!isPhoneNumberValid(mobileNumber)) {
          missing = I18n.t('checkout.missing.mobileNumber');
          error = I18n.t('checkout.error_is_not_valid');
        }
        return ui.showToast(`${missing} ${error}`, 'warning', null, 5);
      }
      // console.log(order);

      Toast.loading('Loading...', 3);
      this.setState({ pending: true });

      await this.updateShippingInfo();

      Toast.hide();
      this.goToPay(order.id, cvc);
    } catch (error) {
      console.debug(error);
    }
    this.setState({ pending: false });
  };

  updateShippingInfo(): Promise<any> {
    const { userData, token } = this.props;
    const { mobileNumber, shippingAddress } = this.state;

    // FIXME: state should be the mobileNumber unformatted. useful also to compare if number has been changed

    return api
      .put(
        `/api/users/${userData._id}`,
        {
          shippingAddress,
          mobileNumber: mobileNumber.replace(/\D/g, ''),
        },
        { token }
      )
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.debug(err);
        ui.showToast(err.message, 'danger');
      });
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
        .catch(err => reject(err));
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
      // this.props.navigation.goBack();
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

  goToPay = async (orderId: string, cvc: string) =>
    this.props.navigation.navigate({
      routeName: 'paymentView',
      key: 'paymentView',
      params: { orderId, cvc },
    });

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
        refProp={el => (this.inputs[2] = el)}
        onItemSelect={async ({ id }) => {
          if (!id) this.setState({ departments: [] });
          else {
            const departments = await api.getDepartments(id);
            this.setState({ departments });
            // Automatically focus on Department InputItem
            this.inputs[3].focus();
          }

          // reset the department field after selecting a new city
          if (this.state.shippingAddress.city !== id) {
            this.autoCompleteRef.onChangeText('');
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
        regexToMatch={cyrillicRegex}
        {...props}
      />
    );
  };

  _renderDepartmentAutocomplete = props => {
    const { shippingAddress, departments, cities, order } = this.state;
    const { token } = this.props;

    const city = cities.find(city => city.id === shippingAddress.city);
    return (
      <SearchableDropdown
        ref={el => (this.autoCompleteRef = el)}
        refProp={el => (this.inputs[3] = el)}
        onItemSelect={async ({ id: department }) => {
          this.setState(
            update(this.state, {
              shippingAddress: { departmentNovaposhta: { $set: department } },
            })
          );
          if (department) {
            this.setState({ areFeesLoading: true });
            const shippingFee = await api.getShippingCosts(
              order.priceOfItem,
              undefined,
              order.id,
              department,
              token
            );
            this.setState({ areFeesLoading: false, shippingFee });
          }
        }}
        disabled={!departments}
        // TODO: color in red if !department.indexOf(query)
        inputContainerStyle={styles.autocompleteContainers}
        itemsContainerStyle={styles.autocompleteItemContainers}
        itemStyle={styles.autocompleteItems}
        items={departments}
        extra={
          !city && (
            <Text>{I18n.t('checkout.department_requirement_right')}</Text>
          )
        }
        {...props}
      />
    );
  };

  renderPricingContainer() {
    const { areFeesLoading, order, shippingFee, seller } = this.state;
    if (areFeesLoading)
      return (
        <View style={{ flex: 1, paddingTop: 10 }}>
          <ActivityIndicator />
        </View>
      );

    const currency = I18n.t(order.currency);

    const total = parseFloat(order.priceOfItem) + parseFloat(shippingFee);

    return (
      <View style={styles.pricesContainer}>
        <View style={styles.row}>
          {/* $FlowFixMe */}
          <Text style={{ color: colors.black }}>
            {I18n.t('checkout.total_row')}
          </Text>
          <View style={styles.innerRow}>
            <Text style={[styles.price, styles.priceTotal]}>
              {ui.formatCurrency(total)}{' '}
            </Text>
            <Text>{currency}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text>{I18n.t('checkout.item_row')}</Text>
          <View style={styles.innerRow}>
            <Text style={styles.price}>
              {ui.formatCurrency(order.priceOfItem)}{' '}
            </Text>
            <Text>{currency}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text>{I18n.t('checkout.shipping_cost_row')}</Text>
          <View style={styles.innerRow}>
            <Text style={styles.price}>{ui.formatCurrency(shippingFee)} </Text>
            <Text>{currency}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text>
            @{seller.username} {I18n.t('checkout.location')}:
          </Text>
          <View style={[styles.innerRow, { paddingTop: 6 }]}>
            <Text>{I18n.t('checkout.ukraine')}</Text>
          </View>
        </View>
      </View>
    );
  }

  onCVCChange = (t: string) => {
    if (t.length <= 3) this.setState({ cvc: t.replace(/\D/g, '') });

    // after 3 digits have been entered
    if (!isNaN(parseInt(t)) && t.length === 3) {
      // ui.hideToasts()
      Keyboard.dismiss();
      setTimeout(() => {
        this._scrollView._root.scrollToEnd({ animated: false });
      }, 600);
    }
  };

  openLink = (link: string) => linking.openURL(link);

  renderMandatory = (
    <>
      <Text style={{ marginHorizontal: 20 }}>
        <NBIcon name="ios-checkmark" style={{ color: colors.grey3 }} />
        <Text>&nbsp;</Text>
        {I18n.t('checkout.paragraph_1').map((para, i) => (
          <React.Fragment key={i}>
            <Text
              style={para.link ? styles.link : styles.paragraph}
              onPress={para.link && this.openLink.bind(this, para.link)}>
              {para.p}
            </Text>
            <Text>&nbsp;</Text>
          </React.Fragment>
        ))}
      </Text>
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <Image
          source={require('../assets/images/visa.png')}
          style={styles.mandatoryImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/mastercard.png')}
          style={styles.mandatoryImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/pci.png')}
          style={styles.mandatoryImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/uapay.png')}
          style={[styles.mandatoryImage, { width: '15%' }]}
          resizeMode="contain"
        />
      </View>
    </>
  );

  render() {
    const { userData } = this.props;
    const {
      cvc,
      cities,
      departments,
      isLoading,
      mobileNumber = '',
      // pending,
      shippingAddress,
      showFooter,
    } = this.state;

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <NBButton
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>
              {I18n.t('checkout.header')}
            </Title>
          </Body>
          <Right>
            {/* <NBButton
              transparent
              dark
              style={{ marginLeft: 5 }}
              onPress={this.onInfoIcon}>
              <MaterialIcons name="live-help" size={18} />
            </NBButton> */}
          </Right>
        </Header>
        {isLoading || !cities ? (
          <View style={styles.container}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            <Content ref={view => (this._scrollView = view)}>
              {this.renderPricingContainer()}
              <HR full />
              <Accordion
                expanded
                headerText={I18n.t('userInfo.shippingAddress')}
                values={[
                  {
                    ref: el => (this.inputs[0] = el),
                    placeholder: I18n.t('userInfo.firstName'),
                    value: shippingAddress.firstName,
                    onFocus: this.handleFocus.bind(this, 0),
                    onSubmitEditing: () => this.changeInputFocus(1),
                    onChangeText: t => {
                      if (cyrillicRegex.test(t))
                        this.setState(
                          update(this.state, {
                            shippingAddress: { firstName: { $set: t } },
                          })
                        );
                    },
                    textContentType: 'givenName',
                    error: !shippingAddress.firstName,
                  },
                  {
                    ref: el => (this.inputs[1] = el),
                    placeholder: I18n.t('userInfo.lastName'),
                    value: shippingAddress.lastName,
                    onFocus: this.handleFocus.bind(this, 1),
                    onSubmitEditing: () => this.changeInputFocus(1),
                    onChangeText: t => {
                      if (cyrillicRegex.test(t))
                        this.setState(
                          update(this.state, {
                            shippingAddress: { lastName: { $set: t } },
                          })
                        );
                    },
                    textContentType: 'familyName',
                    error: !shippingAddress.lastName,
                  },
                  {
                    placeholder: I18n.t('userInfo.city'),
                    value: cities.find(
                      city => city.id === shippingAddress.city
                    ),
                    onFocus: this.handleFocus.bind(this, 2),
                    onSubmitEditing: () => this.changeInputFocus(1),
                    // textContentType: 'addressCity',
                    error: !shippingAddress.city,
                    render: this._renderCityAutocomplete,
                  },
                  {
                    placeholder: I18n.t('userInfo.department'),
                    onFocus: this.handleFocus.bind(this, 3),
                    onSubmitEditing: () => this.changeInputFocus(1),
                    value:
                      departments &&
                      departments.find(
                        d => d.id === shippingAddress.departmentNovaposhta
                      ),
                    error: !shippingAddress.departmentNovaposhta,
                    render: this._renderDepartmentAutocomplete,
                  },
                  {
                    ref: el => (this.inputs[4] = el),
                    placeholder: I18n.t('userInfo.mobileNumber'),
                    value: ui.formatPhoneNumber(mobileNumber),
                    onFocus: this.handleFocus.bind(this, 4),
                    onChangeText: t => this.setState({ mobileNumber: t }),
                    type: 'phone',
                    shouldShowError: () =>
                      isPhoneNumberValid(mobileNumber.replace(/\D/g, '')),
                    textContentType: 'telephoneNumber',
                  },
                ]}
              />
              <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>
                {I18n.t('userInfo.paymentInfo')}
              </FormLabel>
              <View style={{ alignSelf: 'center' }}>
                <TouchableOpacity onPress={this.goToEnterPaymentInfo}>
                  {Object.keys(userData.paymentInfo).length ? (
                    <CardView {...this.formatCardInfo()} focused="number" />
                  ) : (
                    <CardView {...this.formatCardInfo()} number="" expiry="" />
                  )}
                </TouchableOpacity>
                <InputItem
                  ref={el => (this.inputs[5] = el)}
                  autoCorrect={false}
                  error={cvc.length !== 3}
                  last
                  onChange={this.onCVCChange}
                  onFocus={() => this.handleFocus(5)}
                  placeholder="CVC"
                  type="number"
                  value={cvc}
                />
              </View>
              {this.renderMandatory}
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
                      style={[
                        styles.payButtonText,
                        this.canMakePayment() ? {} : { color: colors.white },
                      ]}>
                      {I18n.t('checkout.payment_button')}
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
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  payButtonText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: Platform.select({
      android: 18,
      ios: 16,
    }),
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
  price: {
    fontFamily: Platform.select({
      android: 'monospace',
      ios: 'Helvetica Neue',
    }),
    fontSize: 21,
    lineHeight: 22,
  },
  priceTotal: {
    color: colors.black,
    fontWeight: '600',
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
    minWidth: Platform.select({
      android: 160,
      ios: 130,
    }),
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
  paragraph: {
    color: colors.grey4,
  },
  link: {
    color: colors.grey3,
    textDecorationLine: 'underline',
  },
  mandatoryImage: {
    margin: 10,
    width: '20%',
    height: 50,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  shouldCancelOrder: state.RefresherReducer.shouldCancelOrder,
  shouldRefresh: state.RefresherReducer.shouldRefresh,
  token: state.LoginReducer.token,
  userData: state.LoginReducer.data,
});

export default CheckoutContainer;

export const Checkout = connect(mapStateToProps)(CheckoutContainer);
