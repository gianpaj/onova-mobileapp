// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormInput } from 'react-native-elements';
import { Button as NBButton, Content, Right, Left, Body, Icon as NBIcon } from 'native-base';
import isEmail from 'validator/lib/isEmail';
import { Toast } from 'antd-mobile-rn';
// import AnimButton from 'react-native-micro-animated-button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import I18n from '../i18n';

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
  };
  if (Platform.OS === 'android') {
    // iosuser
    defaultState = {
      emailAddress: 'gianpa+test3@gmail.com',
      password: 'expressos',
    };
  }

  if (isProd) {
    defaultState = {
      // emailAddress: 'gianfranco_p@hotmail.com',
      // password: '***REMOVED***007',
      // emailAddress: 'gianpa@gmail.com',
      // password: '***REMOVED***',
      emailAddress: 'isho@ukr.net',
      password: 'qwe123qwe123',
    };
  }
}

type Props = {
  dispatch: Dispatch,
  loading: boolean,
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
    if (this.props.loading) return;

    let { emailAddress, password } = this.state;

    emailAddress = emailAddress.trim();

    if (!isEmail(emailAddress)) {
      if (emailAddress.length > 0) ui.showToast(I18n.t('signup.alerts.email_invalid'), 'warning', '', 2);
      this.EmailInput.current.shake();
      return this.EmailInput.current.focus();
    }
    if (!password.length) {
      this.PwdInput.current.shake();
      return this.PwdInput.current.focus();
    }

    this.props.dispatch(login({ emailAddress, password })).catch(() => {
      this.setState({ verifyAccountModalVisible: true });
    });
  };

  setPwdResetModalVisible(visible: boolean) {
    this.setState(({ emailReset, emailAddress }) => ({
      emailReset: emailReset ? emailReset : emailAddress,
      pwdResetModalVisible: visible,
    }));
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

  getHandler = (key: string) => (val: any) => this.setState({ [key]: val });

  onPasswordToggle = () =>
    this.setState(prevState => ({
      isPasswordVisible: !prevState.isPasswordVisible,
    }));

  isDisabled() {
    const { emailAddress, password } = this.state;

    return !emailAddress || !password || this.props.loading;
  }

  render() {
    const { emailAddress, hasFocusEmail, hasFocusPass, password, isPasswordVisible } = this.state;
    const { loading } = this.props;

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
            accessibilityLabel="email address"
            keyboardType="email-address"
            onBlur={this._onBlurEmail}
            onChangeText={this.getHandler('emailAddress')}
            onFocus={this._onFocusEmail}
            placeholder={I18n.t('login.email_placeholder')}
            testID="EmailField"
            textContentType="emailAddress"
            underlineColorAndroid={hasFocusEmail ? colors.primary : colors.grey3}
            value={emailAddress}
            {...this._inputProps}
          />
          <View>
            <FormInput
              ref={this.PwdInput}
              accessibilityLabel="password"
              onBlur={this._onBlurPass}
              onChangeText={this.getHandler('password')}
              onFocus={this._onFocusPass}
              placeholder={I18n.t('login.password_placeholder')}
              secureTextEntry={!isPasswordVisible}
              testID="PasswordField"
              textContentType="oneTimeCode" // FIXME:
              underlineColorAndroid={hasFocusPass ? colors.primary : colors.grey3}
              value={password}
              {...this._inputProps}
              clearButtonMode="never"
            />
            <MaterialIcons
              style={styles.pwdIcon}
              name={isPasswordVisible ? 'visibility' : 'visibility-off'}
              size={Platform.select({ ios: 23, android: 25 })}
              color={colors.grey1}
              onPress={this.onPasswordToggle}
            />
          </View>
          <View style={{ marginTop: 20 }}>
            <NBButton
              testID="loginButton"
              block
              disabled={loading}
              dark={!loading}
              onPress={this.onLogin}
              {...buttonProps}>
              <Text
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
              <Text style={{ color: colors.grey4 }}>{I18n.t('login.forgot_password')}</Text>
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
        onRequestClose={() => this.setState({ verifyAccountModalVisible: false })}>
        <>
          <Header transparent style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <NBButton transparent onPress={() => this.setState({ verifyAccountModalVisible: false })}>
                <NBIcon name="close" style={{ color: colors.black }} />
              </NBButton>
            </Right>
          </Header>
          <View style={{ margin: 20 }}>
            <MaterialCommunityIcons
              size={typography.empty_state_icon}
              name={'email-open-outline'}
              color={colors.grey2}
              style={{ alignSelf: 'center', marginBottom: 30 }}
            />
            <Text style={{ color: colors.black, textAlign: 'center' }}>{I18n.t('login.verify_account.title')}</Text>
          </View>
        </>
      </Modal>
    );
  }

  renderPwdResetModal() {
    const { hasFocusEmailReset, emailReset, loadingReset } = this.state;

    const isDisabled = !isEmail(emailReset.trim()) || loadingReset;

    return (
      <Modal
        testID="PwdResetModal"
        animationType="slide"
        visible={this.state.pwdResetModalVisible}
        onRequestClose={() => this.setPwdResetModalVisible(false)}>
        <>
          <Header transparent style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <NBButton transparent onPress={() => this.setPwdResetModalVisible(false)}>
                <NBIcon name="close" style={{ color: colors.black }} />
              </NBButton>
            </Right>
          </Header>
          <View style={{ margin: 20 }}>
            <Text style={{ color: colors.black, fontWeight: 'bold' }}>{I18n.t('login.reset_password.title')}</Text>
            <Text>{I18n.t('login.reset_password.info')}</Text>
          </View>

          <FormInput
            ref={this.PwdReset}
            accessibilityLabel="email address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            blurOnSubmit={false}
            clearButtonMode="while-editing"
            containerStyle={{ margin: 10 }}
            inputStyle={styles.input}
            keyboardType="email-address"
            textContentType="emailAddress"
            onBlur={this._onBlurEmailReset}
            onChangeText={t => this.setState({ emailReset: t })}
            onFocus={this._onFocusEmailReset}
            onSubmitEditing={this.onResetPassword}
            placeholder="Email"
            returnKeyType="go"
            underlineColorAndroid={hasFocusEmailReset ? colors.primary : colors.grey4}
            value={this.state.emailReset}
          />

          <NBButton
            style={{ alignSelf: 'center', minWidth: 260 }}
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
        </>
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
  pwdIcon: {
    position: 'absolute',
    top: 7,
    right: 20,
    zIndex: 10,
  },
  hr: {
    alignSelf: 'center',
    margin: 10,
  },
});
