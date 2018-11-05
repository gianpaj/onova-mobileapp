//@flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Content,
  Right,
  Left,
  Body,
  Button,
  Icon as NBIcon,
} from 'native-base';
import { FormInput } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import isEmail from 'validator/lib/isEmail';

import I18n from '../i18n';
import { Header } from '../components';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, ReduxState } from '../types';

import { signup } from '../actions/actionCreator';
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
  hasFocusUser: boolean,
  hasFocusEmail: boolean,
  hasFocusPass: boolean,
  isVerifyAccountModalVisible: boolean,
};

const FORM_VERTICAL_PADDING_KEYBOARD_HIDDEN = 10;
const FORM_VERTICAL_PADDING_KEYBOARD_VISIBLE = 40;

export class SignUpTabContainer extends Component<Props, State> {
  UserNameInput: ?FormInput;
  EmailInput: ?FormInput;
  PwdInput: ?FormInput;

  constructor(props: Props) {
    super(props);

    this.keyboardHeight = new Animated.Value(
      FORM_VERTICAL_PADDING_KEYBOARD_VISIBLE
    );

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
    this.keyboardWillShowSub = Keyboard.addListener(
      'keyboardDidShow',
      this.keyboardWillShow
    );
    this.keyboardWillHideSub = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardWillHide
    );
  }

  componentWillUnmount() {
    this.keyboardWillShowSub.remove();
    this.keyboardWillHideSub.remove();
  }

  keyboardWillShow = event =>
    Animated.timing(this.keyboardHeight, {
      duration: event ? event.duration : 250,
      toValue: Platform.select({
        ios: FORM_VERTICAL_PADDING_KEYBOARD_HIDDEN,
        android: FORM_VERTICAL_PADDING_KEYBOARD_HIDDEN / 2,
      }),
    }).start();

  keyboardWillHide = event =>
    Animated.timing(this.keyboardHeight, {
      duration: event ? event.duration : 250,
      toValue: FORM_VERTICAL_PADDING_KEYBOARD_VISIBLE,
    }).start();

  setVerifyAccountVisible = (visible: boolean) =>
    this.setState({ isVerifyAccountModalVisible: visible });

  onSignup = () => {
    const { username, emailAddress, password } = this.state;

    // console.debug('onSignup()', username, emailAddress, password);

    if (username.trim() < 3) {
      this.UserNameInput.current.shake();
      return this.UserNameInput.current.focus();
    } else if (username.trim().length < 3) {
      this.UserNameInput.current.shake();
      ui.showToast(
        'Please enter a longer username (min 3 chars)',
        'warning',
        null,
        2
      );
      return this.UserNameInput.current.focus();
    } else if (username.trim().length > 50) {
      this.UserNameInput.current.shake();
      ui.showToast('Please enter a shorter username', 'warning', null, 2);
      return this.UserNameInput.current.focus();
    } else if (!settings.USERNAME_REGEX.test(username)) {
      this.UserNameInput.current.shake();
      ui.showToast('Please enter a valid username', 'warning', null, 2);
      return this.UserNameInput.current.focus();
    } else if (emailAddress.trim() < 1) {
      this.EmailInput.current.shake();
      return this.EmailInput.current.focus();
    } else if (!isEmail(emailAddress)) {
      this.EmailInput.current.shake();
      ui.showToast('Email is not valid', 'warning', null, 2);
      return this.EmailInput.current.focus();
    } else if (!password.length) {
      this.PwdInput.current.shake();
      return this.PwdInput.current.focus();
    } else if (password.length < 8) {
      this.PwdInput.current.shake();
      ui.showToast('Please enter a longer password', 'warning', null, 2);
      return this.PwdInput.current.focus();
    } else if (password.length > 50) {
      this.PwdInput.current.shake();
      ui.showToast('Please enter a shorter password', 'warning', null, 2);
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
      .catch(err => {
        console.warn(err);
      });
  };

  onUserChange = (username: string) => {
    if (settings.USERNAME_REGEX.test(username)) this.setState({ username });
  };

  getHandler = (key: string) => (val: any) => {
    this.setState({ [key]: val });
  };

  onPasswordToggle = () =>
    this.setState(prevState => ({
      isPasswordVisible: !prevState.isPasswordVisible,
    }));

  openTerm() {
    linking.openURL('https://onova.co/terms-and-condition.html');
  }

  openPolicy() {
    linking.openURL('https://onova.co/privacy-policy.html');
  }

  /*
  componentWillUpdate(nextProps, nextState) {
    // const { loading } = nextProps;
    const {
      emailAddress: emailAddressNext,
      password: passwordNext,
      disabled: disabledNext,
      username: usernameNext,
    } = nextState;
    const { emailAddress, password, disabled, username } = this.state;

    // if (!loading && this.signupBtn) {
    //   this.signupBtn.reset();
    // }

    if (
      emailAddressNext !== emailAddress ||
      passwordNext !== password ||
      usernameNext !== username ||
      disabledNext !== disabled
    ) {
      if (
        !isEmail(emailAddressNext) ||
        !validPassword(passwordNext) ||
        usernameNext.length < 3
        // loading
      ) {
        // this.setState({ disabled: true });
        Animated.timing(this.animatedValue, {
          toValue: 0,
          duration: 300,
        }).start();
      } else {
        // this.setState({ disabled: false });
        Animated.timing(this.animatedValue, {
          toValue: 1,
          duration: 300,
        }).start();
      }
    }
  }*/

  isDisabled() {
    const { emailAddress, password, username } = this.state;
    return (
      !isEmail(emailAddress) ||
      !validPassword(password) ||
      username.length < 3 ||
      this.props.loading
    );
  }

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    clearButtonMode: 'while-editing',
    editable: !this.props.loading,
    inputStyle: styles.input,
  };

  _onBlurUser = () => this.setState({ hasFocusUser: false });
  _onFocusUser = () => this.setState({ hasFocusUser: true });

  _onBlurEmail = () => this.setState({ hasFocusEmail: false });
  _onFocusEmail = () => this.setState({ hasFocusEmail: true });

  _onBlurPass = () => this.setState({ hasFocusPass: false });
  _onFocusPass = () => this.setState({ hasFocusPass: true });

  render() {
    const {
      hasFocusUser,
      hasFocusEmail,
      hasFocusPass,
      isPasswordVisible,
    } = this.state;

    return (
      <Content testID="signup-form">
        <Animated.View
          style={[styles.container, { paddingVertical: this.keyboardHeight }]}>
          <FormInput
            ref={this.UserNameInput}
            placeholder={I18n.t('signup.username_placeholder')}
            returnKeyType="next"
            onBlur={this._onBlurUser}
            onFocus={this._onFocusUser}
            onSubmitEditing={() =>
              this.EmailInput && this.EmailInput.current.focus()
            }
            value={this.state.username}
            onChangeText={this.onUserChange}
            accessibilityLabel="username"
            textContentType="username"
            underlineColorAndroid={hasFocusUser ? colors.primary : colors.grey3}
            {...this._inputProps}
          />
          <FormInput
            ref={this.EmailInput}
            placeholder={I18n.t('signup.email_placeholder')}
            keyboardType="email-address"
            returnKeyType="next"
            onBlur={this._onBlurEmail}
            onFocus={this._onFocusEmail}
            onSubmitEditing={() =>
              this.PwdInput && this.PwdInput.current.focus()
            }
            value={this.state.emailAddress}
            testID="EmailField"
            onChangeText={this.getHandler('emailAddress')}
            accessibilityLabel="email address"
            textContentType="emailAddress"
            underlineColorAndroid={
              hasFocusEmail ? colors.primary : colors.grey3
            }
            {...this._inputProps}
          />
          <View>
            <FormInput
              ref={this.PwdInput}
              secureTextEntry={!isPasswordVisible}
              placeholder={I18n.t('signup.password_placeholder')}
              returnKeyType="go"
              onBlur={this._onBlurPass}
              onFocus={this._onFocusPass}
              onSubmitEditing={this.onSignup}
              value={this.state.password}
              onChangeText={this.getHandler('password')}
              accessibilityLabel="password"
              textContentType="password"
              underlineColorAndroid={
                hasFocusPass ? colors.primary : colors.grey3
              }
              {...this._inputProps}
              clearButtonMode="unless-editing"
            />
            {this.state.hasFocusPass && (
              <MaterialIcons
                style={styles.pwdIcon}
                name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                size={Platform.select({ ios: 23, android: 25 })}
                color={colors.grey1}
                onPress={this.onPasswordToggle}
              />
            )}
          </View>
          <View style={styles.mt15}>
            {/* <AnimButton
              ref={r => (this.signupBtn = r)}
              disabled={this.state.disabled}
              style={[
                styles.SignupButton,
                {
                  backgroundColor: this.backgroundColor,
                  // elevation: this.animatedValue, // android
                  // shadowOpacity: this.animatedValue, // ios
                },
              ]}
              {...buttonProps}
              onPress={this.onSignup}
              label={I18n.t('signup.sign_up_button')}
              labelStyle={{ color: colors.white }}
              accessibilityLabel={I18n.t('signup.sign_up_button')}
            /> */}
            <Button
              testID="signUpButton"
              block
              disabled={this.props.loading}
              dark
              // style={[
              //   {
              //     backgroundColor: this.backgroundColor,
              //   },
              // ]}
              {...buttonProps}
              onPress={this.onSignup}>
              <Text
                // eslint-disable-next-line
                style={{
                  fontSize: 16,
                  color: colors.white,
                }}>
                {I18n.t('signup.sign_up_button')}
              </Text>
            </Button>
          </View>
          <View
            style={{
              alignSelf: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingVertical: 20,
              width: 320,
            }}>
            <Text style={{ color: colors.grey4 }}>
              {I18n.t('signup.terms_text_1')}
              &nbsp;
            </Text>
            <TouchableOpacity onPress={this.openTerm}>
              <Text style={styles.termsLink}>
                {I18n.t('signup.terms_text_2')}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: colors.grey4 }}>
              &nbsp;
              {I18n.t('signup.terms_text_3')}
              &nbsp;
            </Text>
            <TouchableOpacity onPress={this.openPolicy}>
              <Text style={styles.termsLink}>
                {I18n.t('signup.terms_text_4')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {this.renderVerifyAccountModal()}
      </Content>
    );
  }

  renderVerifyAccountModal() {
    return (
      <Modal
        animationType="slide"
        visible={this.state.isVerifyAccountModalVisible}
        onRequestClose={() => this.setVerifyAccountVisible(false)}>
        <View>
          <Header noShadow style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <Button
                transparent
                onPress={() => this.setVerifyAccountVisible(false)}>
                <NBIcon name="close" style={{ color: colors.black }} />
              </Button>
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
}

const buttonProps = {
  foregroundColor: colors.white,
  labelStyle: { fontSize: 16 },
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
  mt15: {
    marginTop: 15,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  loading: state.LoginReducer.loading,
  isVerifyAccountModalVisible: state.LoginReducer.isVerifyAccountModalVisible,
});

export const SignUpTab = connect(mapStateToProps)(SignUpTabContainer);
