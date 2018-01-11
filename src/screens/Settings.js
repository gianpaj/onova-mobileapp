// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Linking,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
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
  UIManager,
} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, FormLabel } from 'react-native-elements';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';
import { CardView, LiteCreditCardInput } from 'react-native-credit-card-input';
import { Toast } from 'antd-mobile';
import isEmail from 'validator/lib/isEmail';

import { getPersonalUserData } from '../actions/actionCreator';
import HR from '../components/HR';
import colors from '../config/colors';
import { validPassword } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { UserData, Dispatch } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp,
  userData: UserData,
  fetchLoading: boolean,
};

type State = {
  emailAddress: string,
  pending: boolean,
  password: string,
  paymentInfo: {
    valid: boolean,
    values: {
      expiry: string,
      number: string,
    },
  },
  showSavedInfo: boolean,
};

class SettingsContainer extends Component<Props, State> {
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
    showSavedInfo: true,
  };

  componentWillMount() {
    this.props.dispatch(getPersonalUserData(this.props.userData._id));
  }

  componentWillReceiveProps(nextProps) {
    const { emailAddress } = nextProps.userData;
    this.setState({ emailAddress });
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  settingsCanBeUpdated = (): boolean => {
    const { userData } = this.props;
    const { pending, password, emailAddress, paymentInfo } = this.state;

    // @TODO: check password is valid
    // @TODO: check email is valid
    return (
      !pending &&
      (paymentInfo.valid ||
        validPassword(password) ||
        (isEmail(emailAddress) && emailAddress !== userData.emailAddress))
    );
  };

  updateSettings = () => {
    const { userData } = this.props;
    const { password, emailAddress, paymentInfo } = this.state;

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
        // go back
        this.setState({ pending: false });
        Toast.hide();
      })
      .catch(err => {
        Toast.hide();
        console.debug(err);
        ui.showToast(err.message, 'danger');
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
      brand: 'visa',
      number: `**** **** **** ${paymentInfo.last_four}`,
      expiry: `${paymentInfo.exp_month} / ${paymentInfo.exp_year}`,
      name: ' ',
    };
  }

  render() {
    const { userData } = this.props;
    const { pending, password, emailAddress, showSavedInfo } = this.state;

    return (
      <Container>
        <Header>
          <Left>
            <NBButton
              transparent
              dark
              onPress={() =>
                this.props.navigation ? this.props.navigation.goBack() : null
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
              disabled={!this.settingsCanBeUpdated()}
              style={{ backgroundColor: 'transparent' }}
              onPress={this.updateSettings}>
              <Icon
                name="check"
                style={
                  !this.settingsCanBeUpdated() ? { color: colors.grey3 } : null
                }
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <Content style={{ backgroundColor: colors.white }}>
          {/* {fetchLoading ? (
            <Container style={styles.container}>
              <ActivityIndicator size="large" />
            </Container>
          ) : (
            <View> */}
          <View style={styles.padder}>
            <FormLabel labelStyle={styles.label}>Shipping Address:</FormLabel>
            <FormInput
              autoCorrect={false}
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              // onChangeText={t => this.changePrice(t)}
              placeholder="Enter your shipping address here"
              // value={userData.shippingAddress}
            />
            <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>
              Payment Info:
            </FormLabel>
            {userData.paymentInfo && showSavedInfo ? (
              <View style={{ alignSelf: 'center' }}>
                <TouchableOpacity
                  onPress={() => this.setState({ showSavedInfo: false })}>
                  <CardView {...this.formatCardInfo()} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ paddingLeft: 10 }}>
                <LiteCreditCardInput onChange={this._onCCChange} />
              </View>
            )}
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
              placeholder="Change your email address. Requires validation"
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
          {/* </View>
        )} */}
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
  fetchLoading: state.LoginReducer.fetchLoading,
});

export const Settings = connect(mapStateToProps)(SettingsContainer);
