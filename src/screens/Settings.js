// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { Body, Button as NBButton, Container, Content, Icon as NBIcon, Left, Right } from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, FormLabel } from 'react-native-elements';
import type { NavigationScreenProp } from 'react-navigation';
import { Toast } from 'antd-mobile-rn';
import axios from 'axios';
import isEmail from 'validator/lib/isEmail';
import update from 'immutability-helper';
// import Instabug from 'instabug-reactnative';
import { KeyboardAccessoryNavigation } from 'react-native-keyboard-accessory';

import { Accordion, CardView, Header, HR, SearchableDropdown, Title } from '../components';

import { disableRefresh, getPersonalUserData, intro } from '../actions/actionCreator';

import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import { validPassword, validShippingAddress, isPhoneNumberValid } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import * as linking from '../utils/linking';

import { version } from '../../package.json';

if (!Object.is) {
  Object.is = function(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  };
}

// regexr.com/42aoo
// allow empty string || cyrillic chars with whitespaces
const cyrillicRegex = /^$|^[\u0400-\u04FF\s]+$/;

import type { City, Department, UserData, Dispatch, PaymentInfo, ShippingAddress, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
  shouldRefresh?: boolean,
};

type State = {
  activeInputRef: any,
  cities: ?Array<City>,
  departments: ?Array<Department>,
  emailAddress: string,
  isLoading: boolean,
  mobileNumber: string,
  nextFocusDisabled: boolean,
  password: string,
  pending: boolean,
  previousFocusDisabled: boolean,
  shippingAddress: ?ShippingAddress,
  username: string,
  usernameError: boolean,
};

class SettingsContainer extends Component<Props, State> {
  cancelToken;
  didFocusListener;
  inputs: Array<any> = [];
  state = {
    activeInputRef: null,
    emailAddress: '',
    cities: null,
    departments: null,
    isLoading: true,
    mobileNumber: '',
    nextFocusDisabled: false,
    password: '',
    pending: false,
    previousFocusDisabled: false,
    shippingAddress: null,
    username: '',
    usernameError: false,
  };

  async componentDidMount() {
    await this.refresh();

    this.didFocusListener = this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        this.refresh();
        this.props.dispatch(disableRefresh());
      }
    });
    // Instabug.startWithToken(
    //   settings.INSTABUG_TOKEN,
    //   Instabug.invocationEvent.none
    // );
    // Instabug.setPromptOptionsEnabled(false, true, true);

    const cities = await api.getCities(this.props.token);
    this.setState({ cities });

    if (this.state.shippingAddress && this.state.shippingAddress.city) {
      const departments = await api.getDepartments(this.state.shippingAddress.city);
      this.setState({ departments });
    }
    this.setState({ isLoading: false });

    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  refresh = () => {
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    return this.props.dispatch(getPersonalUserData({ cancelToken: this.cancelToken.token }));
  };

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');
    this.didFocusListener.remove();
  }

  static getDerivedStateFromProps(props, state) {
    if (state.isLoading) {
      return {
        shippingAddress: props.userData.shippingAddress,
        username: props.userData.username,
        emailAddress: props.userData.emailAddress,
        mobileNumber: props.userData.mobileNumber,
      };
    }

    // Return null to indicate no change to state.
    return null;
  }

  /**
   * return true if there are any valid and unsaved changes to be able to save them
   */
  hasUnsavedChanges = (): boolean => {
    const { userData } = this.props;
    const {
      cities,
      departments,
      emailAddress,
      mobileNumber,
      password,
      pending,
      shippingAddress,
      username,
    } = this.state;

    return (
      !pending &&
      ((shippingAddress &&
        shippingAddress.city &&
        cities &&
        validShippingAddress(shippingAddress, cities, departments)) ||
        validPassword(password) ||
        // allow to delete the mobile number
        // FIXME: the logic should not return true if both the state.mobileNumber and userData.mobileNumber are empty
        (!mobileNumber && mobileNumber !== userData.mobileNumber ? isPhoneNumberValid(mobileNumber) : false) ||
        (isEmail(emailAddress) && emailAddress !== userData.emailAddress) ||
        (username !== '' && username !== userData.username))
    );
  };

  onSave = () => {
    const { userData, token } = this.props;
    const { emailAddress, mobileNumber, password, shippingAddress, username } = this.state;
    const data = {};

    this.setState({ pending: true });

    if (username !== '') data.username = username;

    if (password !== '') data.password = password;

    if (emailAddress !== userData.emailAddress) {
      data.emailAddress = emailAddress;
    }

    // if (validShippingAddress(shippingAddress)) {
    data.shippingAddress = shippingAddress;
    // }

    // FIXME: state should be the number unformatted. useful also when comparing if number has been changed
    if (typeof mobileNumber === 'string') {
      data.mobileNumber = mobileNumber.replace(/\D/g, '');
    }

    // console.log(data);

    Toast.loading(I18n.t('alerts.loading_message'), 3);

    api
      .put(`/api/users/${userData._id}`, data, { token })
      .then(() => {
        // console.log(res);
        // if we changed the email
        if (data.emailAddress) {
          ui.showToast(I18n.t('settings.alert_msg_email_address_changed'), 'success');
        } else {
          ui.showToast(I18n.t('settings.alert_msg_settigs_changed'), 'success');
        }
        this.goBack()
      })
      .catch(err => {
        console.debug(err);
        ui.showToast(err.message, 'danger');
      })
      // final
      .then(() => {
        Toast.hide();
        this.setState({ pending: false });
      });
  };

  onUserChange = (username: string) => {
    if (!settings.USERNAME_REGEX.test(username)) {
      this.setState({ usernameError: true });

      setTimeout(() => {
        this.setState({ usernameError: false });
      }, 100);
    }

    return this.setState({ username });
  };

  onSignout = () => this.props.dispatch(intro());

  formatCardInfo() {
    const {
      paymentInfo: { first_four, last_four },
    }: { paymentInfo: PaymentInfo } = this.props.userData;

    const number = `${first_four || '****'} **** **** ${last_four}`;

    return {
      number,
      scale: 0.5,
    };
  }

  handleFocus = (ref: number) =>
    this.setState({
      activeInputRef: ref,
      previousFocusDisabled: ref === 0,
      nextFocusDisabled: ref === 7,
    });

  changeInputFocus(direction = 1) {
    if ((this.state.nextFocusDisabled && direction === 1) || (this.state.previousFocusDisabled && direction === -1)) {
      return;
    }

    const focusingRef = this.state.activeInputRef + direction;
    this.inputs[focusingRef] && this.inputs[focusingRef].focus();
  }

  enterPaymentInfo = () =>
    this.props.navigation.navigate({
      routeName: 'enterCardInfo',
      key: 'enterCardInfo',
      params: { short: true },
    });

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
    const { shippingAddress, departments, cities } = this.state;

    const city = cities.find(city => city.id === shippingAddress.city);
    return (
      <SearchableDropdown
        ref={el => (this.autoCompleteRef = el)}
        refProp={el => (this.inputs[3] = el)}
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
        extra={!city && <Text>{I18n.t('checkout.department_requirement_right')}</Text>}
        {...props}
      />
    );
  };

  goBack = () => this.props.navigation && this.props.navigation.goBack();

  render() {
    const { userData } = this.props;
    const {
      cities,
      departments,
      emailAddress,
      isLoading,
      mobileNumber = '',
      password,
      pending,
      shippingAddress,
      username,
      usernameError,
    } = this.state;

    if (isLoading || !userData) return null;

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <NBButton transparent dark onPress={this.goBack}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title>{I18n.t('settings.header')}</Title>
          </Body>
          <Right>
            <NBButton
              transparent
              disabled={!this.hasUnsavedChanges()}
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onSave}>
              <Icon name="check" style={!this.hasUnsavedChanges() && { color: colors.grey4 }} size={28} />
            </NBButton>
          </Right>
        </Header>
        <Content>
          <View style={styles.padder}>
            <Accordion
              // TODO: auto expand if the shipping address fields are invalid or not valid
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
                  textContentType: 'streetAddressLine2',
                },
                {
                  placeholder: I18n.t('userInfo.city'),
                  value: cities.find(city => city.id === shippingAddress.city),
                  onFocus: this.handleFocus.bind(this, 2),
                  onSubmitEditing: () => this.changeInputFocus(1),
                  // textContentType: 'addressCity',
                  render: this._renderCityAutocomplete,
                },
                {
                  placeholder: I18n.t('userInfo.department'),
                  onFocus: this.handleFocus.bind(this, 3),
                  onSubmitEditing: () => this.changeInputFocus(1),
                  value: departments && departments.find(d => d.id === shippingAddress.departmentNovaposhta),
                  render: this._renderDepartmentAutocomplete,
                },
                {
                  ref: el => (this.inputs[4] = el),
                  placeholder: I18n.t('userInfo.mobileNumber'),
                  value: ui.formatPhoneNumber(mobileNumber),
                  onFocus: this.handleFocus.bind(this, 4),
                  onChangeText: t => this.setState({ mobileNumber: t }),
                  type: 'phone',
                  shouldShowError: () => (mobileNumber ? isPhoneNumberValid(mobileNumber) : true),
                  textContentType: 'telephoneNumber',
                },
              ]}
            />
            <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>{I18n.t('userInfo.paymentInfo')}</FormLabel>
            <View style={{ alignSelf: 'center' }}>
              <TouchableOpacity onPress={this.enterPaymentInfo}>
                {Object.keys(userData.paymentInfo).length ? (
                  <CardView {...this.formatCardInfo()} focused="number" />
                ) : (
                  <CardView {...this.formatCardInfo()} />
                )}
              </TouchableOpacity>
            </View>
            {/* <View style={styles.padder}> */}
            {/* <Text style={[styles.padder, styles.secureText]}> */}
            {/* Your data is secured with a 2048-bit encryption SSL certificate */}
            {/* for More info please refer to the FAQ */}
            {/* </Text> */}
            {/* </View> */}
          </View>
          <View style={styles.padder}>
            <FormLabel labelStyle={styles.label}>{I18n.t('settings.username_label')}</FormLabel>
            <FormInput
              ref={el => (this.inputs[5] = el)}
              autoCorrect={false}
              autoCapitalize="none"
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              onChangeText={t => this.onUserChange(t)}
              placeholder={I18n.t('settings.username_placeholder')}
              value={username}
              clearButtonMode="while-editing"
              shake={usernameError}
              onFocus={this.handleFocus.bind(this, 5)}
              onSubmitEditing={this.changeInputFocus.bind(this, 1)}
            />
            <FormLabel labelStyle={styles.label}>{I18n.t('settings.email_label')}</FormLabel>
            <FormInput
              ref={el => (this.inputs[6] = el)}
              autoCorrect={false}
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              onChangeText={t => this.setState({ emailAddress: t })}
              placeholder={I18n.t('settings.email_placeholder')}
              value={emailAddress}
              clearButtonMode="while-editing"
              onFocus={this.handleFocus.bind(this, 6)}
              onSubmitEditing={this.changeInputFocus.bind(this, 1)}
            />
            <FormLabel labelStyle={styles.label}>{I18n.t('settings.password_label')}</FormLabel>
            <FormInput
              ref={el => (this.inputs[7] = el)}
              autoCorrect={false}
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              onChangeText={t => this.setState({ password: t })}
              secureTextEntry
              placeholder={I18n.t('settings.password_placeholder')}
              value={password}
              clearButtonMode="while-editing"
              onFocus={this.handleFocus.bind(this, 7)}
            />
            <HR full />
            <TouchableOpacity
              style={{
                marginVertical: 15,
                marginHorizontal: 20,
                width: '40%',
              }}
              hitSlop={linkHitSlop}
              accessibilityRole="link"
              onPress={linking.openURL.bind(this, 'https://onova.co/faq.html')}>
              <Text style={styles.labelLink}>{I18n.t('settings.faq')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginVertical: 15, marginHorizontal: 20, width: '70%' }}
              hitSlop={linkHitSlop}
              accessibilityRole="link"
              onPress={() => this.props.navigation.navigate('markdownDoc')}>
              <Text style={styles.labelLink}>{I18n.t('settings.safe_purchase_rules')}</Text>
            </TouchableOpacity>
          </View>
          {/* TODO: add Notifications switch */}
          {/* You only get notifications for messages and status updates in your sales or purchases.
            We won't distract when you get new followers and other non-important matters */}
          <View style={[styles.padder, { alignItems: 'center' }]}>
            <NBButton light full onPress={this.onSignout}>
              <Text>{I18n.t('settings.sign_out_button')}</Text>
            </NBButton>
            <TouchableOpacity
              style={styles.padder}
              accessibilityRole="link"
              onPress={linking.email.bind(this, 'mailto:hello@onova.co')}>
              <Text style={styles.centerText}>hello@onova.co</Text>
            </TouchableOpacity>
            <Text style={styles.centerText}>{version}</Text>
          </View>
          {/* <HR full /> */}
          {/* <NBButton light full onPress={() => Instabug.invoke()}>
            <Text>Report a problem or suggest an improvement</Text>
          </NBButton> */}
        </Content>
        {Platform.OS == 'ios' && (
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

const linkHitSlop = { top: 10, left: 5, bottom: 10, right: 10 };

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: colors.black,
    fontWeight: '600',
  },
  labelLink: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    color: colors.black,
    width: '100%',
  },
  padder: {
    padding: 10,
  },
  inputContainer: {
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  centerText: {
    color: colors.grey4,
    paddingVertical: 10,
  },
  // secureText: {
  //   color: colors.grey2,
  //   paddingBottom: 0,
  // },
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

export const Settings = connect(mapStateToProps)(SettingsContainer);
