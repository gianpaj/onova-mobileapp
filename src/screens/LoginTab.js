// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  // Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FormInput } from 'react-native-elements';
import {
  Button as NBButton,
  Content,
  Right,
  Left,
  Body,
  Icon as NBIcon,
} from 'native-base';
import isEmail from 'validator/lib/isEmail';
import { Toast } from 'antd-mobile';
import AnimButton from 'react-native-micro-animated-button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import I18n from '../i18n';

import type { NavigationScreenProp } from 'react-navigation';

import { Header } from '../components';
import { login } from '../actions/actionCreator';
import * as api from '../utils/api';
import colors from '../config/colors';
import typography from '../config/typography';

import type { Dispatch, ReduxState } from '../types';

let defaultState = {};
let isProd = false;
if (process.env.NODE_ENV == 'prod' || process.env.NODE_ENV == 'production') {
  isProd = true;
}

if (__DEV__) {
  defaultState = {
    // emailAddress: 'gianpa+test@gmail.com',
    // password: 'expressos',
    // local
    emailAddress: 'gianpa+test@gmail.com',
    password: 'expressos',
  };

  if (isProd) {
    defaultState = {
      emailAddress: 'gianfranco_p@hotmail.com',
      password: '***REMOVED***007',
      // prod
      // emailAddress: 'gianpa@gmail.com',
      // password: '***REMOVED***',
    };
  }
}

type Props = {
  dispatch: Dispatch,
  loading: boolean,
  navigation?: NavigationScreenProp<*>,
};

type State = {
  emailAddress: string,
  emailReset: string,
  hasFocusEmail: boolean,
  hasFocusEmailReset: boolean,
  hasFocusPass: boolean,
  loadingReset: boolean,
  pwdResetModalVisible: boolean,
  verifyAccountModalVisible: boolean,
  password: string,
};

class LoginTabContainer extends React.Component<Props, State> {
  PwdInput: ?FormInput;
  // loginBtn;
  // animatedValue = new Animated.Value(__DEV__ ? 1 : 0);
  // backgroundColor = this.animatedValue.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [colors.grey4, colors.primary],
  // });

  state = {
    emailAddress: '',
    emailReset: '',
    hasFocusEmail: false,
    hasFocusEmailReset: false,
    hasFocusPass: false,
    loadingReset: false,
    pwdResetModalVisible: false,
    verifyAccountModalVisible: false,
    password: '',
    ...defaultState,
  };

  onLogin = () => {
    const { emailAddress, password } = this.state;
    if (!emailAddress || !password || this.props.loading) return;
    this.props.dispatch(login({ emailAddress, password })).catch(() => {
      this.setVerifyAccountVisible(true);
    });
  };

  // googleSignin() {
  //   this.props.dispatch(loginWithGoogle());
  // }

  setPwdResetModalVisible(visible: boolean) {
    this.setState(prevState => {
      return {
        emailReset: prevState.emailReset
          ? prevState.emailReset
          : prevState.emailAddress,
        pwdResetModalVisible: visible,
      };
    });
  }

  setVerifyAccountVisible(visible: boolean) {
    this.setState({ verifyAccountModalVisible: visible });
  }

  onResetPassword = () => {
    if (!isEmail(this.state.emailReset)) {
      return;
    }

    this.setState({ loadingReset: true });
    api
      .post('/api/auth/reset', {
        emailAddress: this.state.emailReset,
      })
      .then((res: any) => {
        if (res.message) {
          Toast.success(res.message, 5);
        }
        console.log(res);
      })
      .catch((err: api.APIError) => {
        // if (err.status = 400) {
        Toast.success(err.message, 5);
        // }
      })
      .then(() => this.setPwdResetModalVisible(false))
      .then(() => this.setState({ loadingReset: false }));
  };

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    clearButtonMode: 'while-editing',
    editable: !this.props.loading,
    enablesReturnKeyAutomatically: true,
    inputStyle: styles.input,
  };

  /**
   * trigger the background color animation of the LoginButton
   *
  DISABLED_componentWillUpdate(nextProps, nextState) {
    // const { loadingLogin } = nextProps;
    const {
      emailAddress: emailAddressNext,
      password: passwordNext,
      disabled: disabledNext,
    } = nextState;
    const { emailAddress, password, disabled } = this.state;

    // if we are waiting for the login API call to return
    // if (!loading && this.loginBtn) {
    //   this.loginBtn.reset();
    // }

    if (
      emailAddressNext !== emailAddress ||
      passwordNext !== password ||
      disabledNext !== disabled
    ) {
      // if the email or password are empty
      const areFieldEmpty = !emailAddressNext || !passwordNext;
      // this.setState({ disabled: areFieldEmpty });
      Animated.timing(this.animatedValue, {
        toValue: areFieldEmpty ? 0 : 1,
        duration: 300,
      }).start();
    }
  }*/

  _onBlurEmail = () => this.setState({ hasFocusEmail: false });
  _onFocusEmail = () => this.setState({ hasFocusEmail: true });

  _onBlurPass = () => this.setState({ hasFocusPass: false });
  _onFocusPass = () => this.setState({ hasFocusPass: true });

  _onBlurEmailReset = () => this.setState({ hasFocusEmailReset: false });
  _onFocusEmailReset = () => this.setState({ hasFocusEmailReset: true });

  isDisabled() {
    const { emailAddress, password } = this.state;
    if (!emailAddress || !password || this.props.loading) {
      return true;
    }
    return false;
  }

  render() {
    const { emailAddress, password, hasFocusEmail, hasFocusPass } = this.state;

    return (
      <Content testID="login-form">
        <View
          style={{
            flex: 1,
            width: '80%',
            alignSelf: 'center',
            marginTop: 40,
          }}>
          <FormInput
            placeholder={I18n.t('login.email_placeholder')}
            keyboardType="email-address"
            returnKeyType="next"
            onBlur={this._onBlurEmail}
            onFocus={this._onFocusEmail}
            onSubmitEditing={() => this.PwdInput && this.PwdInput.focus()}
            value={emailAddress}
            testID="EmailField"
            onChangeText={text => this.setState({ emailAddress: text })}
            underlineColorAndroid={
              hasFocusEmail ? colors.primary : colors.grey3
            }
            {...this._inputProps}
          />
          <FormInput
            ref={c => (this.PwdInput = c)}
            secureTextEntry
            placeholder={I18n.t('login.password_placeholder')}
            returnKeyType="go"
            onBlur={this._onBlurPass}
            onFocus={this._onFocusPass}
            onSubmitEditing={this.onLogin}
            value={password}
            testID="PasswordField"
            onChangeText={password => this.setState({ password })}
            underlineColorAndroid={hasFocusPass ? colors.primary : colors.grey3}
            {...this._inputProps}
          />
          <View style={{ marginTop: 15 }}>
            {/* <AnimButton
              ref={r => (this.loginBtn = r)}
              disabled={disabled}
              noRadius
              style={[
                styles.LoginButton,
                {
                  backgroundColor: this.backgroundColor,
                },
              ]}
              {...buttonProps}
              onPress={this.onLogin}
              label={I18n.t('login.log_in_button')}
              labelStyle={{ color: colors.white }}
              testID="LoginButton"
            /> */}
            <NBButton
              block
              disabled={this.isDisabled()}
              dark={!this.isDisabled()}
              {...buttonProps}
              // style={[
              //   {
              //     backgroundColor: this.backgroundColor,
              //   },
              // ]}
              onPress={this.onLogin}>
              <Text
                // eslint-disable-next-line
                style={{
                  fontSize: 16,
                  color: colors.white,
                }}>
                {I18n.t('login.log_in_button')}
              </Text>
            </NBButton>
            <TouchableOpacity
              style={[styles.hr, { padding: 10, margin: 20 }]}
              onPress={() => this.setPwdResetModalVisible(true)}>
              <Text style={{ color: colors.grey4 }}>
                {I18n.t('login.forgot_password')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {this.renderPwdResetModal()}
        {this.renderVerifyAccountModal()}
      </Content>
    );
  }

  renderVerifyAccountModal() {
    return (
      <Modal
        animationType="slide"
        visible={this.state.verifyAccountModalVisible}
        onRequestClose={() => this.setVerifyAccountVisible(false)}>
        <View>
          <Header noShadow style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <NBButton
                transparent
                onPress={() => this.setVerifyAccountVisible(false)}>
                <NBIcon name="close" style={{ color: colors.black }} />
              </NBButton>
            </Right>
          </Header>
          <View style={{ margin: 20 }}>
            <Icon
              size={typography.empty_state_icon}
              name={'email-open-outline'}
              color={colors.grey2}
              style={{ alignSelf: 'center', marginBottom: 30 }}
            />
            <Text
              style={{
                color: colors.black,
                textAlign: 'center',
              }}>
              {I18n.t('login.verify_account.title')}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  renderPwdResetModal() {
    const { hasFocusEmailReset } = this.state;

    return (
      <Modal
        animationType="slide"
        visible={this.state.pwdResetModalVisible}
        onRequestClose={() => this.setPwdResetModalVisible(false)}>
        <View>
          <Header noShadow style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <NBButton
                transparent
                onPress={() => this.setPwdResetModalVisible(false)}>
                <NBIcon name="close" style={{ color: colors.black }} />
              </NBButton>
            </Right>
          </Header>
          <View style={{ margin: 20 }}>
            <Text style={{ color: colors.black, fontWeight: 'bold' }}>
              {I18n.t('login.reset_password.title')}
            </Text>
            <Text>{I18n.t('login.reset_password.info')}</Text>
          </View>

          <FormInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            clearButtonMode="while-editing"
            containerStyle={{ margin: 10 }}
            inputStyle={styles.input}
            keyboardType="email-address"
            onBlur={this._onBlurEmailReset}
            onChangeText={text => this.setState({ emailReset: text })}
            onFocus={this._onFocusEmailReset}
            placeholder="Email"
            returnKeyType="go"
            underlineColorAndroid={
              hasFocusEmailReset ? colors.primary : colors.grey4
            }
            value={this.state.emailReset}
          />

          <AnimButton
            disabled={
              !isEmail(this.state.emailReset) || this.state.loadingReset
            }
            foregroundColor={colors.white}
            style={[
              styles.LoginButton,
              {
                backgroundColor:
                  isEmail(this.state.emailReset) || this.state.loadingReset
                    ? colors.primary
                    : colors.grey4,
              },
            ]}
            onPress={this.onResetPassword}
            label={I18n.t('login.reset_password.button')}
            labelStyle={{ color: colors.white }}
            testID="ResetButton"
            noRadius
          />
        </View>
      </Modal>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  loading: state.LoginReducer.loading,
});

export const LoginTab = connect(mapStateToProps)(LoginTabContainer);

const buttonProps = {
  foregroundColor: colors.white,
  labelStyle: { fontSize: 16 },
  maxWidth: Platform.select({
    ios: 346,
    android: 383,
  }),
};

const styles = StyleSheet.create({
  input: {
    color: colors.black,
    width: '100%',
  },
  LoginButton: {
    alignSelf: 'center',
  },
  hr: {
    alignSelf: 'center',
    margin: 10,
  },
});
