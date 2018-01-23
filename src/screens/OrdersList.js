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
import { Toast } from 'antd-mobile';
import axios from 'axios';
import update from 'immutability-helper';

import { getOrdersAndThreads } from '../actions/actionCreator';

import colors from '../config/colors';
import settings from '../config/settings';
import { validShippingAddress } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { UserData, Dispatch, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp,
  userData: UserData,
  ordersData: any,
};

type State = {
  loading: boolean,
};

class OrdersListContainer extends Component<Props, State> {
  cancelToken;
  state = {
    loading: false,
  };

  componentWillMount() {
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    this.props.dispatch(
      getOrdersAndThreads(this.props.userData._id, {
        cancelToken: this.cancelToken.token,
      })
    );
  }

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');
  }

  componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;

    // const { username } = nextProps.userData;
  }

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
    const { pending } = this.state;

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
            <Title>OrdersList</Title>
          </Body>
          <Right>
            <NBButton
              transparent
              disabled={!this.hasUnsavedChanges()}
              // eslint-disable-next-line
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
              placeholder="Change your username"
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
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const OrdersList = connect(mapStateToProps)(OrdersListContainer);
