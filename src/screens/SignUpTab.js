//@flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Animated, Keyboard, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { Content, Right, Left, Body, Button, Icon as NBIcon } from 'native-base';
import { FormInput } from 'react-native-elements';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import isEmail from 'validator/lib/isEmail';
import { URL } from 'react-native-dotenv';

import { Header } from '../components';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, ReduxState } from '../types';

import I18n from '../i18n';
import { signup, skip } from '../actions/actionCreator';
import { validPassword } from '../utils/validators';
import * as linking from '../utils/linking';
import * as ui from '../utils/ui';
import colors from '../config/colors';
import settings from '../config/settings';
import typography from '../config/typography';

type Props = {
  dispatch: Dispatch,
  loading: boolean,
  navigation?: NavigationScreenProp<*>,
  isVerifyAccountModalVisible: boolean,
};

type State = {
  username: string,
  emailAddress: string,
  password: string,
  isPasswordVisible: boolean,
  hasFocusUser: boolean,
  hasFocusEmail: boolean,
  hasFocusPass: boolean,
  isVerifyAccountModalVisible: boolean,
};

const FORM_VERTICAL_PADDING_KEYBOARD_HIDDEN = 10;
const FORM_VERTICAL_PADDING_KEYBOARD_VISIBLE = 40;

export class SignUpTabContainer extends Component<Props, State> {
  UserNameInput: { current: any };
  EmailInput: { current: any };
  PwdInput: { current: any };
  keyboardHeight: Animated.Value;
  keyboardWillShowSub;
  keyboardWillHideSub;

  constructor(props: Props) {
    super(props);

    this.keyboardHeight = new Animated.Value(FORM_VERTICAL_PADDING_KEYBOARD_VISIBLE);

    this.UserNameInput = React.createRef();
    this.EmailInput = React.createRef();
    this.PwdInput = React.createRef();

    this.state = {
      username: '',
      emailAddress: '',
      password: '',
      hasFocusUser: false,
      hasFocusEmail: false,
      hasFocusPass: false,
      isPasswordVisible: false,
      isVerifyAccountModalVisible: props.isVerifyAccountModalVisible,
    };
  }

  componentDidMount() {
    this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow);
    this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide);
  }

  componentWillUnmount() {
    this.keyboardWillShowSub.remove();
    this.keyboardWillHideSub.remove();
  }

  keyboardWillShow = (event: any) =>
    Animated.timing(this.keyboardHeight, {
      duration: event ? event.duration : 250,
      toValue: Platform.select({
        ios: FORM_VERTICAL_PADDING_KEYBOARD_HIDDEN,
        android: FORM_VERTICAL_PADDING_KEYBOARD_HIDDEN / 2,
      }),
    }).start();

  keyboardWillHide = (event: any) =>
    Animated.timing(this.keyboardHeight, {
      duration: event ? event.duration : 250,
      toValue: FORM_VERTICAL_PADDING_KEYBOARD_VISIBLE,
    }).start();

  onSkip = () => this.props.dispatch(skip());

  onSignup = () => {
    if (this.props.loading || !this.UserNameInput || !this.EmailInput) return;

    let { username, emailAddress, password } = this.state;
    const prefix = 'signup.alerts.';

    emailAddress = emailAddress.trim();

    if (!username.trim()) {
      this.UserNameInput.current.shake();
      return this.UserNameInput.current.focus();
    } else if (username.trim().length < 3) {
      this.UserNameInput.current.shake();
      ui.showToast(I18n.t(prefix + 'username_too_short'), 'warning', '', 2);
      return this.UserNameInput.current.focus();
    } else if (username.trim().length > 50) {
      ui.showToast(I18n.t(prefix + 'username_too_long'), 'warning', '', 2);
      this.UserNameInput.current.shake();
      return this.UserNameInput.current.focus();
    } else if (!settings.USERNAME_REGEX.test(username)) {
      ui.showToast(I18n.t(prefix + 'username_invalid'), 'warning', '', 2);
      this.UserNameInput.current.shake();
      return this.UserNameInput.current.focus();
    } else if (!isEmail(emailAddress)) {
      if (emailAddress.length > 0) ui.showToast(I18n.t(prefix + 'email_invalid'), 'warning', '', 2);
      this.EmailInput.current.shake();
      return this.EmailInput.current.focus();
    } else if (!validPassword(password)) {
      if (password.length && password.length < 8) {
        ui.showToast(I18n.t(prefix + 'password_too_short'), 'warning', '', 2);
      } else if (password.length > 50) {
        ui.showToast(I18n.t(prefix + 'password_too_long'), 'warning', '', 2);
      }
      this.PwdInput.current.shake();
      return this.PwdInput.current.focus();
    }
    // username min(3) max(30)
    // password min(8) max(50)

    // if(this.state.password != this.state.pwdAgainValue) {
    //   return Toast.show({
    //     text: 'Both passwords do not match',
    //     duration: 2000,
    //     position: "top",
    //     textStyle: { textAlign: "center" },
    //   });
    // }

    // this.signupBtn.load();

    this.props
      .dispatch(signup({ username, emailAddress, password }))
      .then(() => this.setVerifyAccountVisible(true))
      .catch(err => console.debug(err));
  };

  openPrivacyPolicy() {
    linking.openURL(`https://${URL}/privacy-policy.html`);
  }

  openTerms() {
    linking.openURL(`https://${URL}/terms-and-condition.html`);
  }

  openSafePurchase() {
    linking.openURL(`https://${URL}/safe-purchase-rules.html`);
  }

  isDisabled() {
    const { emailAddress, password, username } = this.state;
    return !isEmail(emailAddress) || !validPassword(password) || username.length < 3 || this.props.loading;
  }

  setVerifyAccountVisible = (visible: boolean) => this.setState({ isVerifyAccountModalVisible: visible });

  onUserChange = (username: string) => settings.USERNAME_REGEX.test(username) && this.setState({ username });

  getHandler = (key: string) => (val: any) => this.setState({ [key]: val });

  onPasswordToggle = () =>
    this.setState(prevState => ({
      isPasswordVisible: !prevState.isPasswordVisible,
    }));

  _onBlurUser = () => this.setState({ hasFocusUser: false });
  _onFocusUser = () => this.setState({ hasFocusUser: true });

  _onBlurEmail = () => this.setState({ hasFocusEmail: false });
  _onFocusEmail = () => this.setState({ hasFocusEmail: true });

  _onBlurPass = () => this.setState({ hasFocusPass: false });
  _onFocusPass = () => this.setState({ hasFocusPass: true });

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    blurOnSubmit: false,
    clearButtonMode: 'while-editing',
    editable: !this.props.loading,
    onSubmitEditing: this.onSignup,
    returnKeyType: 'go',
  };

  render() {
    const { hasFocusUser, hasFocusEmail, hasFocusPass, isPasswordVisible } = this.state;
    const { loading } = this.props;

    return (
      <Content testID="signup-form">
        <Animated.View style={[styles.container, { paddingVertical: this.keyboardHeight }]}>
          <FormInput
            ref={this.UserNameInput}
            accessibilityLabel="username"
            onBlur={this._onBlurUser}
            onChangeText={this.onUserChange}
            onFocus={this._onFocusUser}
            placeholder={I18n.t('signup.username_placeholder')}
            textContentType="username"
            underlineColorAndroid={hasFocusUser ? colors.primary : colors.grey3}
            value={this.state.username}
            {...this._inputProps}
          />
          <FormInput
            ref={this.EmailInput}
            accessibilityLabel="email address"
            keyboardType="email-address"
            onBlur={this._onBlurEmail}
            onChangeText={this.getHandler('emailAddress')}
            onFocus={this._onFocusEmail}
            placeholder={I18n.t('signup.email_placeholder')}
            testID="EmailField"
            textContentType="emailAddress"
            underlineColorAndroid={hasFocusEmail ? colors.primary : colors.grey3}
            value={this.state.emailAddress}
            {...this._inputProps}
          />
          <View>
            <FormInput
              ref={this.PwdInput}
              secureTextEntry={!isPasswordVisible}
              placeholder={I18n.t('signup.password_placeholder')}
              onBlur={this._onBlurPass}
              onFocus={this._onFocusPass}
              value={this.state.password}
              onChangeText={this.getHandler('password')}
              accessibilityLabel="password"
              textContentType="newPassword"
              underlineColorAndroid={hasFocusPass ? colors.primary : colors.grey3}
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
          <View style={styles.mt20}>
            <Button
              testID="signUpButton"
              block
              disabled={loading}
              dark={!loading}
              {...buttonProps}
              onPress={this.onSignup}>
              <Text style={styles.signUpButtonText}>{I18n.t('signup.sign_up_button')}</Text>
            </Button>
            <Button
              testID="skipButton"
              block
              disabled={loading}
              dark={!loading}
              bordered
              style={styles.mt20}
              {...buttonProps}
              onPress={this.onSkip}>
              <Text style={[styles.skipButtonText, loading ? { color: colors.grey3 } : {}]}>
                {I18n.t('signup.skip')}
              </Text>
            </Button>
          </View>
          {this.renderFooterText()}
        </Animated.View>
        {this.renderVerifyAccountModal()}
      </Content>
    );
  }

  renderFooterText() {
    return (
      <View style={styles.footer}>
        <Text>
          <Text style={{ color: colors.grey4 }}>{I18n.t('signup.terms_text_1')}</Text>
          &nbsp;
          <Text onPress={this.openPrivacyPolicy} style={styles.link}>
            {I18n.t('signup.terms_text_2')}
          </Text>
          <Text>&nbsp;</Text>
          <Text onPress={this.openTerms} style={styles.link}>
            {I18n.t('signup.terms_text_3')}
          </Text>
          <Text>&nbsp;</Text>
          <Text onPress={this.openSafePurchase} style={styles.link}>
            {I18n.t('signup.terms_text_4')}
          </Text>
        </Text>
      </View>
    );
  }

  renderVerifyAccountModal() {
    return (
      <Modal
        animationType="slide"
        visible={this.state.isVerifyAccountModalVisible}
        onRequestClose={() => this.setVerifyAccountVisible(false)}>
        <>
          <Header transparent style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <Button transparent onPress={() => this.setVerifyAccountVisible(false)}>
                <NBIcon name="close" style={{ color: colors.black }} />
              </Button>
            </Right>
          </Header>
          <View style={styles.m20}>
            <MaterialCommunityIcons
              size={50}
              name={'email-open-outline'}
              color={colors.grey2}
              style={styles.verificationEmailIcon}
            />
            <Text style={styles.emailAddressToVerify}>{this.state.emailAddress}</Text>
            <Text style={styles.verificationMessage}>{I18n.t('login.verify_account.title')}</Text>
            {/* TODO: add re-send button */}
          </View>
        </>
      </Modal>
    );
  }
}

const buttonProps = {
  foregroundColor: colors.white,
  labelStyle: { fontSize: typography.font_button_size },
  maxWidth: Platform.select({
    ios: 346,
    android: 383,
  }),
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '80%',
  },
  signUpButtonText: {
    color: colors.white,
    fontSize: typography.font_button_size,
  },
  skipButtonText: {
    color: colors.black,
    fontSize: typography.font_button_size,
  },
  pwdIcon: {
    position: 'absolute',
    top: 7,
    right: 20,
    zIndex: 10,
  },
  m20: {
    margin: 20,
  },
  mt20: {
    marginTop: 20,
  },
  footer: {
    alignSelf: 'center',
    paddingVertical: 20,
    width: 320,
  },
  verificationEmailIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  link: {
    color: colors.grey2,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  emailAddressToVerify: {
    color: colors.black,
    marginBottom: 30,
    textAlign: 'center',
  },
  verificationMessage: {
    color: colors.black,
    textAlign: 'center',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  loading: state.LoginReducer.loading,
  isVerifyAccountModalVisible: state.LoginReducer.isVerifyAccountModalVisible,
});

export const SignUpTab = connect(mapStateToProps)(SignUpTabContainer);
