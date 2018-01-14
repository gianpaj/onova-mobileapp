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
  // $FlowFixMe
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
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';
import { CardView, LiteCreditCardInput } from 'react-native-credit-card-input';
import FlipCard from 'react-native-flip-card';
import { Toast } from 'antd-mobile';
import axios from 'axios';
import isEmail from 'validator/lib/isEmail';
import update from 'immutability-helper';

import HR from '../components/HR';
import Accordion from '../components/Accordion';
import { getPersonalUserData } from '../actions/actionCreator';
import colors from '../config/colors';
import { validPassword, validShippingAddress } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type {
  UserData,
  Dispatch,
  PaymentInfo,
  ShippingAddress,
} from '../types';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp,
  userData: UserData,
};

type State = {
  emailAddress: string,
  pending: boolean,
  password: string,
  shippingAddress: ShippingAddress,
  paymentInfo: PaymentInfo,
};

class SettingsContainer extends Component<Props, State> {
  cancelToken;
  state = {
    emailAddress: '',
    pending: false,
    password: '',
    paymentInfo: {
      valid: false,
      values: {
        expiry: '',
        number: '',
      },
    },
    shippingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: '',
      postcode: '',
    },
  };

  componentWillMount() {
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    this.props.dispatch(
      getPersonalUserData(this.props.userData._id, {
        cancelToken: this.cancelToken.token,
      })
    );
  }

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');
  }

  componentWillReceiveProps(nextProps) {
    const { emailAddress, shippingAddress } = nextProps.userData;
    if (shippingAddress) {
      this.setState({ emailAddress, shippingAddress });
    } else {
      this.setState({ emailAddress });
    }
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  canUpdate = (): boolean => {
    const { userData } = this.props;
    const {
      pending,
      password,
      emailAddress,
      paymentInfo,
      shippingAddress,
    } = this.state;

    return (
      !pending &&
      (validShippingAddress(shippingAddress) ||
        paymentInfo.valid ||
        validPassword(password) ||
        (isEmail(emailAddress) && emailAddress !== userData.emailAddress))
    );
  };

  updateSettings = () => {
    const { userData } = this.props;
    const { password, emailAddress, paymentInfo, shippingAddress } = this.state;

    this.setState({ pending: true });

    const data = {};
    data.username = userData.username;

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
      .put(`/api/users/${userData._id}`, data)
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

  onEmail() {
    Linking.openURL('mailto:hello@onova.co')
      .then(() => {
        console.log('email client opened');
      })
      .catch(err => console.error('An error occurred', err));
  }

  _onCCChange = form => {
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

  render() {
    const { userData } = this.props;
    const { pending, password, emailAddress, shippingAddress } = this.state;

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
              disabled={!this.canUpdate()}
              style={{ backgroundColor: 'transparent' }}
              onPress={this.updateSettings}>
              <Icon
                name="check"
                style={!this.canUpdate() && { color: colors.grey3 }}
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
                <LiteCreditCardInput onChange={this._onCCChange} />
              </View>
            </FlipCard>
          </View>
          <HR full />
          <View style={styles.padder}>
            <FormLabel labelStyle={styles.label}>Email:</FormLabel>
            <FormInput
              autoCorrect={false}
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              onChangeText={t => this.setState({ emailAddress: t })}
              placeholder="Change your email address. Requires email verification"
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
          <HR full />
          <View style={[styles.padder, { alignItems: 'center' }]}>
            <TouchableOpacity onPress={this.onEmail}>
              <Text style={styles.centerText}>hello@onova.co</Text>
            </TouchableOpacity>
            <Text style={styles.centerText}>__version__</Text>
          </View>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
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
});

const mapStateToProps: any = (state: any) => ({
  userData: state.LoginReducer.data,
});

export const Settings = connect(mapStateToProps)(SettingsContainer);
