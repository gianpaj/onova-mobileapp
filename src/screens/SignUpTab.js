//@flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  // Animated,
  Modal,
  Linking,
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
// $FlowFixMe
// import AnimButton from 'react-native-micro-animated-button';
import isEmail from 'validator/lib/isEmail';

import I18n from '../i18n';
import { Header } from '../components';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, ReduxState } from '../types';

import { signup } from '../actions/actionCreator';
import { validPassword } from '../utils/validators';
import colors from '../config/colors';
import settings from '../config/settings';
import typography from '../config/typography';

type Props = {
  dispatch: Dispatch,
  loading: boolean,
  navigation: NavigationScreenProp<*>,
};

type State = {
  username: string,
  emailAddress: string,
  password: string,
  hasFocusUser: boolean,
  hasFocusEmail: boolean,
  hasFocusPass: boolean,
  verifyAccountModalVisible: boolean,
};

class SignUpTabContainer extends Component<Props, State> {
  EmailInput: ?FormInput;
  // signupBtn;
  PwdInput: ?FormInput;
  // animatedValue = new Animated.Value(0);
  // backgroundColor = this.animatedValue.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [colors.grey4, colors.primary],
  // });

  state = {
    // username: 'gianfranco',
    // emailAddress: 'gianfranco_p@hotmail.com',
    // password: '***REMOVED***',
    username: '',
    emailAddress: '',
    password: '',
    hasFocusUser: false,
    hasFocusEmail: false,
    hasFocusPass: false,
    verifyAccountModalVisible: false,
  };

  setVerifyAccountVisible(visible: boolean) {
    this.setState({ verifyAccountModalVisible: visible });
  }

  onSignup = () => {
    const { username, emailAddress, password } = this.state;

    console.debug('onSignup()', username, emailAddress, password);

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
      .catch(() => {
        this.setVerifyAccountVisible(true);
      });
  };

  onUserChange = (u: string) => {
    if (settings.USERNAME_REGEX.test(u) || u.length == 0) {
      this.setState({ username: u });
    }
  };

  openTerm() {
    Linking.openURL('https://onova.co/terms-and-condition.html').catch(err =>
      console.error('An error occurred', err)
    );
  }

  openPolicy() {
    Linking.openURL('https://onova.co/privacy-policy.html').catch(err =>
      console.error('An error occurred', err)
    );
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
    if (
      !isEmail(emailAddress) ||
      !validPassword(password) ||
      username.length < 3 ||
      this.props.loading
    ) {
      return true;
    }
    return false;
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
    const { hasFocusUser, hasFocusEmail, hasFocusPass } = this.state;

    return (
      <Content testID="signup-form">
        <View
          style={{ flex: 1, width: '80%', alignSelf: 'center', marginTop: 40 }}>
          <FormInput
            placeholder={I18n.t('signup.username_placeholder')}
            returnKeyType="next"
            onBlur={this._onBlurUser}
            onFocus={this._onFocusUser}
            onSubmitEditing={() => this.EmailInput && this.EmailInput.focus()}
            value={this.state.username}
            onChangeText={t => this.onUserChange(t)}
            accessibilityLabel="username"
            underlineColorAndroid={hasFocusUser ? colors.primary : colors.grey3}
            {...this._inputProps}
          />
          <FormInput
            ref={c => (this.EmailInput = c)}
            placeholder={I18n.t('signup.email_placeholder')}
            keyboardType="email-address"
            returnKeyType="next"
            onBlur={this._onBlurEmail}
            onFocus={this._onFocusEmail}
            onSubmitEditing={() => this.PwdInput && this.PwdInput.focus()}
            value={this.state.emailAddress}
            testID="EmailField"
            onChangeText={emailAddress => this.setState({ emailAddress })}
            accessibilityLabel="email address"
            underlineColorAndroid={
              hasFocusEmail ? colors.primary : colors.grey3
            }
            {...this._inputProps}
          />
          <FormInput
            ref={c => (this.PwdInput = c)}
            secureTextEntry
            placeholder={I18n.t('signup.password_placeholder')}
            returnKeyType="go"
            onBlur={this._onBlurPass}
            onFocus={this._onFocusPass}
            onSubmitEditing={this.onSignup}
            value={this.state.password}
            onChangeText={password => this.setState({ password })}
            accessibilityLabel="password"
            underlineColorAndroid={hasFocusPass ? colors.primary : colors.grey3}
            {...this._inputProps}
          />
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
              testID="SignupButton"
              label={I18n.t('signup.sign_up_button')}
              labelStyle={{ color: colors.white }}
              accessibilityLabel={I18n.t('signup.sign_up_button')}
            /> */}
            <Button
              block
              disabled={this.isDisabled()}
              dark={!this.isDisabled()}
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
              {I18n.t('signup.terms_text_1')}&nbsp;
            </Text>
            <TouchableOpacity onPress={this.openTerm}>
              <Text style={[styles.linkText, styles.termsLink]}>
                {I18n.t('signup.terms_text_2')}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: colors.grey4 }}>
              &nbsp;{I18n.t('signup.terms_text_3')}&nbsp;
            </Text>
            <TouchableOpacity onPress={this.openPolicy}>
              <Text style={[styles.linkText, styles.termsLink]}>
                {I18n.t('signup.terms_text_4')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  input: {
    color: colors.black,
    width: '100%',
  },
  // SignupButton: {
  //   alignSelf: 'center',
  //   borderWidth: 0,
  //   borderRadius: 0,
  // },
  mt15: {
    marginTop: 15,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  loading: state.LoginReducer.loading,
});

export const SignUpTab = connect(mapStateToProps)(SignUpTabContainer);
