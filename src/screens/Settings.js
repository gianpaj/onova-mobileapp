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
  Header,
  Icon as NBIcon,
  Left,
  Right,
  Title,
} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, FormLabel } from 'react-native-elements';
import type { NavigationScreenProp } from 'react-navigation';
import { CardView, LiteCreditCardInput } from 'react-native-credit-card-input';
import FlipCard from 'react-native-flip-card';
import { Toast } from 'antd-mobile';
import axios from 'axios';
import isEmail from 'validator/lib/isEmail';
import update from 'immutability-helper';
import Instabug from 'instabug-reactnative';

import { Accordion, HR } from '../components';

import { getPersonalUserData, logout } from '../actions/actionCreator';

import colors from '../config/colors';
import settings from '../config/settings';
import { validPassword, validShippingAddress } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

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
};

class SettingsContainer extends Component<Props, State> {
  cancelToken;
  state = {
    emailAddress: '',
    pending: false,
    isLoading: true,
    password: '',
    paymentInfo: null,
    shippingAddress: null,
    username: '',
    usernameError: false,
  };

  componentWillMount() {
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    this.props.dispatch(
      getPersonalUserData(this.props.userData._id, {
        cancelToken: this.cancelToken.token,
      })
    );
    Instabug.startWithToken(
      settings.INSTABUG_TOKEN,
      Instabug.invocationEvent.none
    );
    Instabug.setPromptOptionsEnabled(false, true, true);
  }

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');
  }

  componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;

    const { emailAddress, shippingAddress, username } = nextProps.userData;

    if (this.hasStateDifferedFromProps(nextProps.userData, 'shippingAddress')) {
      this.setState({ shippingAddress });
    }

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

  componentDidMount() {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
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
    const { userData } = this.props;
    const {
      password,
      emailAddress,
      paymentInfo,
      shippingAddress,
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

    if (paymentInfo.valid) {
      const { values } = paymentInfo;

      data.last_four = values.number.slice(-4);
      data.exp_month = values.expiry.split('/')[0];
      data.exp_year = values.expiry.split('/')[0];
    }

    if (validShippingAddress(shippingAddress)) {
      data.shippingAddress = shippingAddress;
    }

    console.log(data);

    Toast.loading('Loading...', 3);

    api
      .put(`/api/users/${userData._id}`, data, { token: userData.token })
      .then(res => {
        console.log(res);
        // if we changed the email
        if (data.emailAddress) {
          ui.showToast(
            'The new email address requires to be valided. Please check your inbox',
            'success'
          );
        } else {
          ui.showToast('Your settings have been updated', 'success');
        }
        this.props.navigation && this.props.navigation.goBack();
      })
      .catch(err => {
        console.debug(err);
        ui.showToast(err.message, 'danger');
      })
      .then(() => {
        // final
        Toast.hide();
        this.setState({ pending: false });
      });
  };

  onSendEmail() {
    Linking.openURL('mailto:hello@onova.co')
      .then(() => {
        console.log('email client opened');
      })
      .catch(err => console.error('An error occurred', err));
  }

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
    } else {
      return this.setState({ username: u });
    }

    setTimeout(() => {
      this.setState({ usernameError: false });
    }, 100);
  };

  onSignout = () => {
    this.props.dispatch(logout());
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
    } else {
      return true;
    }
  }

  render() {
    const { userData } = this.props;
    const {
      pending,
      isLoading,
      password,
      emailAddress,
      shippingAddress,
      username,
      usernameError,
    } = this.state;

    if (isLoading) return null;

    return (
      <Container>
        <Header>
          <Left>
            <NBButton
              transparent
              dark
              onPress={() =>
                this.props.navigation && this.props.navigation.goBack()
              }>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body>
            <Title>Settings</Title>
          </Body>
          <Right>
            <NBButton
              transparent
              disabled={!this.hasUnsavedChanges()}
              style={{ backgroundColor: 'transparent' }}
              onPress={this.onSave}>
              <Icon
                name="check"
                style={!this.hasUnsavedChanges() && { color: colors.grey3 }}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <Content style={{ backgroundColor: colors.white }}>
          <View style={styles.padder}>
            <Accordion
              headerText="Shipping Address:"
              values={[
                {
                  content: [
                    {
                      placeholder: 'Address line 1',
                      value: shippingAddress.line1,
                      onChangeValue: t =>
                        this.setState(
                          update(this.state, {
                            shippingAddress: { line1: { $set: t } },
                          })
                        ),
                    },
                    {
                      placeholder: 'Address line 2',
                      value: shippingAddress.line2,
                      onChangeValue: t =>
                        this.setState(
                          update(this.state, {
                            shippingAddress: { line2: { $set: t } },
                          })
                        ),
                    },
                    {
                      placeholder: 'City',
                      value: shippingAddress.city,
                      onChangeValue: t =>
                        this.setState(
                          update(this.state, {
                            shippingAddress: { city: { $set: t } },
                          })
                        ),
                    },
                    {
                      placeholder: 'State',
                      value: shippingAddress.state,
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
            </FlipCard>
            <View style={styles.padder}>
              <Text style={[styles.padder, styles.secureText]}>
                Your data is secured with a 2048-bit encryption SSL certificate
                and stored in PayPal
                {/* for More info please refer to the FAQ */}
              </Text>
            </View>
          </View>
          <HR full />
          <View style={styles.padder}>
            <FormLabel labelStyle={styles.label}>Username:</FormLabel>
            <FormInput
              autoCorrect={false}
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              onChangeText={t => this.onUserChange(t)}
              placeholder="Edit your username"
              value={username}
              clearButtonMode="while-editing"
              shake={usernameError}
            />
            <FormLabel>Private information</FormLabel>
            <FormLabel labelStyle={styles.label}>Email:</FormLabel>
            <FormInput
              autoCorrect={false}
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              onChangeText={t => this.setState({ emailAddress: t })}
              placeholder="Edit your email address (Requires re-verification)"
              value={emailAddress}
              clearButtonMode="while-editing"
            />
            <FormLabel labelStyle={styles.label}>Password:</FormLabel>
            <FormInput
              autoCorrect={false}
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              onChangeText={t => this.setState({ password: t })}
              secureTextEntry
              placeholder="******"
              value={password}
              clearButtonMode="while-editing"
            />
          </View>
          {/* Notifications switch */}
          {/* You only get notifications for messages and status updates in your sales or purchases.
            We won't distract when you get new followers and other non-important matters */}
          <HR full />
          <View style={[styles.padder, { alignItems: 'center' }]}>
            <NBButton light full onPress={this.onSignout}>
              <Text>Sign out</Text>
            </NBButton>
          </View>
          <HR full />
          <View style={[styles.padder, { alignItems: 'center' }]}>
            <TouchableOpacity onPress={this.onSendEmail}>
              <Text style={styles.centerText}>hello@onova.co</Text>
            </TouchableOpacity>
            <Text style={styles.centerText}>__version__</Text>
          </View>
          <HR full />
          <NBButton light full onPress={() => Instabug.invoke()}>
            <Text>Report a problem or suggest an improvement</Text>
          </NBButton>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
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
});

export const Settings = connect(mapStateToProps)(SettingsContainer);
