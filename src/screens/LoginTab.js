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
import { Toast } from 'antd-mobile-rn';
// import AnimButton from 'react-native-micro-animated-button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import I18n from '../i18n';

import type { NavigationScreenProp } from 'react-navigation';

import { Header } from '../components';
import { login } from '../actions/actionCreator';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import colors from '../config/colors';
import typography from '../config/typography';

import type { Dispatch, ReduxState } from '../types';

let defaultState = {};
const { isProd } = api;

if (__DEV__ && !global.__TESTING__) {
  defaultState = {
    // firstperson
    emailAddress: 'gianpa+test@gmail.com',
    password: 'expressos',
    // iosuser
    // emailAddress: 'gianpa+test3@gmail.com',
    // password: '***REMOVED***',
  };

  if (isProd) {
    defaultState = {
      // emailAddress: 'gianfranco_p@hotmail.com',
      // password: '***REMOVED***007',
      // prod
      emailAddress: 'gianpa@gmail.com',
      password: '***REMOVED***',
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
  password: string,
  pwdResetModalVisible: boolean,
  isPasswordVisible: boolean,
  verifyAccountModalVisible: boolean,
};

export class LoginTabContainer extends React.Component<Props, State> {
  PwdInput: any;
  EmailInput: any;
  PwdReset: any;
  constructor(props: Props) {
    super(props);

    this.PwdInput = React.createRef();
    this.EmailInput = React.createRef();
    this.PwdReset = React.createRef();
  }

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
    password: '',
    pwdResetModalVisible: false,
    isPasswordVisible: false,
    verifyAccountModalVisible: false,
    ...defaultState,
  };

  onLogin = () => {
    const { emailAddress, password } = this.state;

    if (emailAddress.trim().length < 1) {
      this.EmailInput.current.shake();
      return this.EmailInput.current.focus();
    } else if (!isEmail(emailAddress)) {
      this.EmailInput.current.shake();
      ui.showToast('Email is not valid', 'warning', null, 2);
      return this.EmailInput.current.focus();
    } else if (!password.length) {
      this.PwdInput.current.shake();
      return this.PwdInput.current.focus();
    }
    if (this.props.loading) return;

    this.props.dispatch(login({ emailAddress, password })).catch(() => {
      this.setState({ verifyAccountModalVisible: true });
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

  onResetPassword = () => {
    if (!isEmail(this.state.emailReset)) {
      this.PwdReset.current.shake();
      this.PwdReset.current.focus();
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
        Toast.success(err.message, 5);
      })
      .then(() => this.setPwdResetModalVisible(false))
      .then(() => this.setState({ loadingReset: false }));
  };

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    blurOnSubmit: false,
    clearButtonMode: 'while-editing',
    editable: !this.props.loading,
    enablesReturnKeyAutomatically: true,
    inputStyle: styles.input,
    onSubmitEditing: this.onLogin,
    returnKeyType: 'go',
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

    return !emailAddress || !password || this.props.loading;
  }

  getHandler = (key: string) => (val: any) => this.setState({ [key]: val });

  render() {
    const {
      emailAddress,
      hasFocusEmail,
      hasFocusPass,
      password,
      isPasswordVisible,
    } = this.state;

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
            ref={this.EmailInput}
            placeholder={I18n.t('login.email_placeholder')}
            keyboardType="email-address"
            onBlur={this._onBlurEmail}
            onFocus={this._onFocusEmail}
            value={emailAddress}
            testID="EmailField"
            textContentType="emailAddress"
            accessibilityLabel="email address"
            onChangeText={this.getHandler('emailAddress')}
            underlineColorAndroid={
              hasFocusEmail ? colors.primary : colors.grey3
            }
            {...this._inputProps}
          />
          <FormInput
            ref={this.PwdInput}
            secureTextEntry={!isPasswordVisible}
            placeholder={I18n.t('login.password_placeholder')}
            onBlur={this._onBlurPass}
            onFocus={this._onFocusPass}
            value={password}
            testID="PasswordField"
            textContentType="password"
            accessibilityLabel="password"
            onChangeText={this.getHandler('password')}
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
              testID="loginButton"
              block
              disabled={this.props.loading}
              dark={!this.props.loading}
              onPress={this.onLogin}
              {...buttonProps}>
              <Text
                // eslint-disable-next-line
                style={{
                  fontSize: typography.font_button_size,
                  color: colors.white,
                }}>
                {I18n.t('login.log_in_button')}
              </Text>
            </NBButton>
            <TouchableOpacity
              testID="openPwdResetModalButton"
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
        onRequestClose={() =>
          this.setState({ verifyAccountModalVisible: false })
        }>
        <View>
          <Header noShadow style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <NBButton
                transparent
                onPress={() =>
                  this.setState({ verifyAccountModalVisible: false })
                }>
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

    const isDisabled =
      !isEmail(this.state.emailReset) || this.state.loadingReset;

    return (
      <Modal
        testID="PwdResetModal"
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
            ref={this.PwdReset}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            autoFocus
            clearButtonMode="while-editing"
            containerStyle={{ margin: 10 }}
            inputStyle={styles.input}
            keyboardType="email-address"
            onBlur={this._onBlurEmailReset}
            onChangeText={text => this.setState({ emailReset: text })}
            onFocus={this._onFocusEmailReset}
            onSubmitEditing={this.onResetPassword}
            placeholder="Email"
            returnKeyType="go"
            underlineColorAndroid={
              hasFocusEmailReset ? colors.primary : colors.grey4
            }
            value={this.state.emailReset}
          />

          <NBButton
            style={{ alignSelf: 'center', width: 200 }}
            testID="ResetButton"
            block
            disabled={isDisabled}
            dark={!isDisabled}
            onPress={this.onResetPassword}>
            <Text
              // eslint-disable-next-line
              style={{
                fontSize: typography.font_button_size,
                color: colors.white,
              }}>
              {I18n.t('login.reset_password.button')}
            </Text>
          </NBButton>
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
  labelStyle: { fontSize: typography.font_button_size },
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
  // PassResetButton: {
  //   alignSelf: 'center',
  //   borderRadius: 5,
  // },
  hr: {
    alignSelf: 'center',
    margin: 10,
  },
});
