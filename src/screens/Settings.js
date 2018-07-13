// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Icon as NBIcon,
  Left,
  Right,
  Title,
} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, FormLabel } from 'react-native-elements';
import type { NavigationScreenProp } from 'react-navigation';
// import { CardView, LiteCreditCardInput } from 'react-native-credit-card-input';
// import FlipCard from 'react-native-flip-card';
import { Toast } from 'antd-mobile';
import axios from 'axios';
import isEmail from 'validator/lib/isEmail';
// import update from 'immutability-helper';
// import Instabug from 'instabug-reactnative';
import { KeyboardAccessoryNavigation } from 'react-native-keyboard-accessory';

import { Header } from '../components';

import { getPersonalUserData, logout } from '../actions/actionCreator';

import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import { validPassword, validShippingAddress } from '../utils/validators';
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

import type {
  UserData,
  Dispatch,
  PaymentInfo,
  ShippingAddress,
  ReduxState,
} from '../types';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  emailAddress: string,
  pending: boolean,
  isLoading: boolean,
  password: string,
  username: string,
  usernameError: boolean,
  shippingAddress: ?ShippingAddress,
  paymentInfo: ?PaymentInfo,
  nextFocusDisabled: boolean,
  previousFocusDisabled: boolean,
  activeInputRef: any,
};

class SettingsContainer extends Component<Props, State> {
  cancelToken;
  inputs = [];
  state = {
    emailAddress: '',
    pending: false,
    isLoading: true,
    password: '',
    paymentInfo: null,
    shippingAddress: null,
    username: '',
    usernameError: false,
    nextFocusDisabled: false,
    previousFocusDisabled: false,
    activeInputRef: null,
  };

  componentDidMount() {
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    this.props.dispatch(
      getPersonalUserData({ cancelToken: this.cancelToken.token })
    );
    // Instabug.startWithToken(
    //   settings.INSTABUG_TOKEN,
    //   Instabug.invocationEvent.none
    // );
    // Instabug.setPromptOptionsEnabled(false, true, true);

    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;

    const { emailAddress, /*shippingAddress,*/ username } = nextProps.userData;

    /*
    if (this.hasStateDifferedFromProps(nextProps.userData, 'shippingAddress')) {
      this.setState({ shippingAddress });
    }*/

    if (this.hasStateDifferedFromProps(nextProps.userData, 'username')) {
      this.setState({ username });
    }

    if (this.hasStateDifferedFromProps(nextProps.userData, 'emailAddress')) {
      this.setState({ emailAddress });
    }

    this.setState({ isLoading: false });
  }

  hasStateDifferedFromProps(nextProps: any, key: string): boolean {
    return nextProps[key] && !Object.is(nextProps[key], this.props[key]);
  }

  /**
   * return true if there are any valid and unsaved changes to be able to save them
   */
  hasUnsavedChanges = (): boolean => {
    const { userData } = this.props;
    const {
      pending,
      password,
      emailAddress,
      paymentInfo,
      shippingAddress,
      username,
    } = this.state;

    return (
      !pending &&
      ((shippingAddress &&
        (validShippingAddress(shippingAddress) &&
          !Object.is(shippingAddress, userData.shippingAddress))) ||
        (paymentInfo && paymentInfo.valid) ||
        validPassword(password) ||
        (isEmail(emailAddress) && emailAddress !== userData.emailAddress) ||
        (username !== '' && username !== userData.username))
    );
  };

  onSave = () => {
    const { userData, token } = this.props;
    const {
      password,
      emailAddress,
      // paymentInfo,
      // shippingAddress,
      username,
    } = this.state;
    const data = {};

    this.setState({ pending: true });

    if (username !== '') {
      data.username = username;
    }

    if (password !== '') {
      data.password = password;
    }

    if (emailAddress !== userData.emailAddress) {
      data.emailAddress = emailAddress;
    }

    /*
    if (paymentInfo.valid) {
      const { values } = paymentInfo;

      data.last_four = values.number.slice(-4);
      data.exp_month = values.expiry.split('/')[0];
      data.exp_year = values.expiry.split('/')[0];
    }

    if (validShippingAddress(shippingAddress)) {
      data.shippingAddress = shippingAddress;
    }*/

    // console.log(data);

    Toast.loading(I18n.t('alerts.loading_message'), 3);

    api
      .put(`/api/users/${userData._id}`, data, { token })
      .then(data => {
        // console.log(res);
        // if we changed the email
        if (data.emailAddress) {
          ui.showToast(
            I18n.t('settings.alert_msg_email_address_changed'),
            'success'
          );
        } else {
          ui.showToast(I18n.t('settings.alert_msg_settigs_changed'), 'success');
        }
        this.props.navigation && this.props.navigation.goBack();
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

  onCCChange = form => {
    this.setState({
      paymentInfo: {
        valid: form.valid,
        values: form.values,
      },
    });
  };

  onUserChange = (u: string) => {
    if (!settings.USERNAME_REGEX.test(u)) {
      this.setState({ usernameError: true });

      setTimeout(() => {
        this.setState({ usernameError: false });
      }, 100);
    }

    return this.setState({ username: u });
  };

  onSignout = () => this.props.dispatch(logout());

  /*
  formatCardInfo() {
    const { paymentInfo } = this.props.userData;

    return {
      number: `**** **** **** ${paymentInfo.last_four}`,
      expiry: `${paymentInfo.exp_month} / ${paymentInfo.exp_year}`,
      name: ' ',
    };
  }
  */

  shouldComponentUpdate(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) {
      return false;
    }
    return true;
  }

  handleFocus(ref) {
    this.setState({
      nextFocusDisabled: ref === 7,
      previousFocusDisabled: ref === 5,
      activeInputRef: ref,
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

  onFAQ() {
    // in Ukrainian
    Linking.openURL('https://onova.co/faq.html').catch(err =>
      console.error('An error occurred', err)
    );
  }

  render() {
    // const { userData } = this.props;
    const {
      pending,
      isLoading,
      password,
      emailAddress,
      // shippingAddress,
      username,
      usernameError,
    } = this.state;

    if (isLoading) return null;

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <NBButton
              transparent
              dark
              onPress={() =>
                this.props.navigation && this.props.navigation.goBack()
              }>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>
              {I18n.t('settings.header')}
            </Title>
          </Body>
          <Right>
            <NBButton
              transparent
              disabled={!this.hasUnsavedChanges()}
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onSave}>
              <Icon
                name="check"
                style={!this.hasUnsavedChanges() && { color: colors.grey4 }}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <Content>
          {/* <View style={styles.padder}> */}
          {/* <Accordion
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
            <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>
              Payment Info:
            </FormLabel>
            <FlipCard
              perspective={1000}
              clickable={
                userData.paymentInfo &&
                Object.keys(userData.paymentInfo).length > 0
              }
              style={{ borderWidth: 0 }}
              flip={
                !userData.paymentInfo ||
                Object.keys(userData.paymentInfo).length == 0
              }>
              <View style={{ alignSelf: 'center' }}>
                {userData.paymentInfo && (
                  <CardView {...this.formatCardInfo()} />
                )}
              </View>
              <View style={{ paddingLeft: 10 }}>
                <LiteCreditCardInput onChange={this.onCCChange} />
              </View>
            </FlipCard> */}
          {/* <View style={styles.padder}> */}
          {/* <Text style={[styles.padder, styles.secureText]}> */}
          {/* Your data is secured with a 2048-bit encryption SSL certificate */}
          {/* for More info please refer to the FAQ */}
          {/* </Text> */}
          {/* </View> */}
          {/* </View> */}
          <View style={styles.padder}>
            <FormLabel labelStyle={styles.label}>
              {I18n.t('settings.username_label')}
            </FormLabel>
            <FormInput
              ref={el => {
                this.inputs[5] = el;
              }}
              autoCorrect={false}
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
            <FormLabel labelStyle={styles.label}>
              {I18n.t('settings.email_label')}
            </FormLabel>
            <FormInput
              ref={el => {
                this.inputs[6] = el;
              }}
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
            <FormLabel labelStyle={styles.label}>
              {I18n.t('settings.password_label')}
            </FormLabel>
            <FormInput
              ref={el => {
                this.inputs[7] = el;
              }}
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
          </View>
          {/* Notifications switch */}
          {/* You only get notifications for messages and status updates in your sales or purchases.
            We won't distract when you get new followers and other non-important matters */}
          <View style={[styles.padder, { alignItems: 'center' }]}>
            <NBButton light full onPress={this.onSignout}>
              <Text>{I18n.t('settings.sign_out_button')}</Text>
            </NBButton>
            <View
              style={[
                styles.padder,
                { alignItems: 'center', flexDirection: 'row' },
              ]}>
              <NBButton transparent onPress={this.onFAQ}>
                <NBIcon
                  name="md-information-circle"
                  style={{ color: colors.grey4 }}
                  size={28}
                />
              </NBButton>
              <TouchableOpacity
                onPress={() => linking.email('mailto:hello@onova.co')}>
                <Text style={styles.centerText}>hello@onova.co</Text>
              </TouchableOpacity>
            </View>
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
  secureText: {
    color: colors.grey2,
    paddingBottom: 0,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const Settings = connect(mapStateToProps)(SettingsContainer);
