// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import { FormInput } from 'react-native-elements';
import {
  Button as NBButton,
  Container,
  Content,
  Header,
  Right,
  Left,
  Body,
  Icon as NBIcon,
} from 'native-base';
import type { NavigationScreenProp } from 'react-navigation';
import isEmail from 'validator/lib/isEmail';
import { Toast } from 'antd-mobile';
import AnimButton from 'react-native-micro-animated-button';

import { login, goToSignup } from '../actions/actionCreator';
import type { Dispatch, ReduxState } from '../types';

import * as api from '../utils/api';
import colors from '../config/colors';

let defaultState = {};

if (__DEV__) {
  defaultState = {
    emailAddress: 'gianpa+test2@gmail.com',
    password: 'express2',
  };
}
if (__DEV__ && Platform.OS == 'ios') {
  defaultState = {
    emailAddress: 'gianpa+test3@gmail.com',
    password: '***REMOVED***',
  };
}

type Props = {
  dispatch: Dispatch,
  loadingLogin: boolean,
  navigation?: NavigationScreenProp<*>,
};

type State = {
  emailAddress: string,
  emailReset: string,
  loadingReset: boolean,
  modalVisible: boolean,
  password: string,
  disabled: boolean,
  hasFocusEmail: boolean,
  hasFocusPass: boolean,
  hasFocusEmailReset: boolean,
};

class LoginScreen extends React.Component<Props, State> {
  PwdInput: ?FormInput;
  loginBtn;
  animatedValue = new Animated.Value(__DEV__ ? 1 : 0);
  backgroundColor = this.animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.grey4, colors.primary],
  });

  state = {
    emailAddress: '',
    password: '',
    modalVisible: false,
    emailReset: '',
    loadingReset: false,
    disabled: false,
    hasFocusEmail: false,
    hasFocusPass: false,
    hasFocusEmailReset: false,
    ...defaultState,
  };

  onLogin = () => {
    const { emailAddress, password } = this.state;
    this.props.dispatch(login({ emailAddress, password }));
  };

  // googleSignin() {
  //   this.props.dispatch(loginWithGoogle());
  // }

  setModalVisible(visible: boolean) {
    this.setState(prevState => {
      return {
        emailReset: prevState.emailReset
          ? prevState.emailReset
          : prevState.emailAddress,
        modalVisible: visible,
      };
    });
  }

  onResetPassword = () => {
    if (!isEmail(this.state.emailReset)) {
      return;
    }

    this.setState({ loadingReset: true });
    api
      .post('/api/auth/reset', {
        emailAddress: this.state.emailAddress,
      })
      .then((res: any) => {
        if (res.message) {
          Toast.success(res.message, 5);
        }
        console.log(res);
        this.setState({ loadingReset: false });
      })
      .catch((err: api.APIError) => {
        // if (err.status = 400) {
        Toast.success(err.message, 5);
        // }
        this.setState({ loadingReset: false });
      })
      .then(() => this.setModalVisible(false));
  };

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    clearButtonMode: 'while-editing',
    editable: !this.props.loadingLogin,
    enablesReturnKeyAutomatically: true,
    inputStyle: styles.input,
  };

  /**
   * trigger the background color animation of the LoginButton
   */
  componentWillUpdate(nextProps, nextState) {
    const { loadingLogin } = nextProps;
    const {
      emailAddress: emailAddressNext,
      password: passwordNext,
      disabled: disabledNext,
    } = nextState;
    const { emailAddress, password, disabled } = this.state;

    // if we are waiting for the login API call to return
    if (!loadingLogin && this.loginBtn) {
      this.loginBtn.reset();
    }

    if (
      emailAddressNext !== emailAddress ||
      passwordNext !== password ||
      disabledNext !== disabled
    ) {
      // if the email or password are empty
      const areFieldEmpty = !emailAddressNext || !passwordNext;
      this.setState({ disabled: areFieldEmpty });
      Animated.timing(this.animatedValue, {
        toValue: areFieldEmpty ? 0 : 1,
        duration: 300,
      }).start();
    }
  }

  _onBlurEmail = () => this.setState({ hasFocusEmail: false });
  _onFocusEmail = () => this.setState({ hasFocusEmail: true });

  _onBlurPass = () => this.setState({ hasFocusPass: false });
  _onFocusPass = () => this.setState({ hasFocusPass: true });

  _onBlurEmailReset = () => this.setState({ hasFocusEmailReset: false });
  _onFocusEmailReset = () => this.setState({ hasFocusEmailReset: true });

  render() {
    const {
      emailAddress,
      password,
      disabled,
      hasFocusEmail,
      hasFocusPass,
    } = this.state;

    return (
      <Container>
        <Content testID="login-form">
          <View style={styles.header}>
            <View style={{ alignItems: 'center' }}>
              <Icon name="flash" style={{ fontSize: 104 }} />
              <Text>Onova.co</Text>
              <View>
                <Text style={{ color: colors.black }}>
                  Buy and sell clothes from your phone
                </Text>
              </View>
            </View>
          </View>
          <FormInput
            placeholder="Email"
            keyboardType="email-address"
            returnKeyType="next"
            onBlur={this._onBlurEmail}
            onFocus={this._onFocusEmail}
            onSubmitEditing={() =>
              this.PwdInput ? this.PwdInput.focus() : undefined
            }
            value={emailAddress}
            testID="EmailField"
            onChangeText={text => this.setState({ emailAddress: text })}
            underlineColorAndroid={
              hasFocusEmail ? colors.primary : colors.grey2
            }
            {...this._inputProps}
          />
          <FormInput
            ref={c => {
              this.PwdInput = c;
            }}
            secureTextEntry
            placeholder="Password"
            returnKeyType="go"
            onBlur={this._onBlurPass}
            onFocus={this._onFocusPass}
            onSubmitEditing={this.onLogin}
            value={password}
            testID="PasswordField"
            onChangeText={text => this.setState({ password: text })}
            underlineColorAndroid={hasFocusPass ? colors.primary : colors.grey2}
            {...this._inputProps}
          />
          <Text
            style={styles.hr}
            onPress={() => {
              this.setModalVisible(true);
            }}>
            Forgot Password?
          </Text>
          <View style={{ marginTop: 15 }}>
            <AnimButton
              ref={r => (this.loginBtn = r)}
              disabled={disabled}
              // eslint-disable-next-line
              style={[styles.LoginButton, {
                  backgroundColor: this.backgroundColor,
                  // elevation: this.animatedValue, // android
                  // shadowOpacity: this.animatedValue, // ios
                },
              ]}
              {...buttonProps}
              onPress={() => this.onLogin()}
              label="Log in"
              testID="LoginButton"
            />
            <Text style={styles.hr}>
              <Text style={styles.hrLine}>────────</Text> or{' '}
              <Text style={styles.hrLine}>────────</Text>
            </Text>
            <AnimButton
              style={styles.PDarkButton}
              onPress={() => this.props.dispatch(goToSignup())}
              {...buttonProps}
              label="Sign up"
              testID="SignupButton"
              static
            />
            {/* <Footer></Footer> */}
          </View>
        </Content>
        {this.renderPasswordResetModal()}
      </Container>
    );
  }

  renderPasswordResetModal() {
    const { hasFocusEmailReset } = this.state;

    return (
      <Modal
        animationType="slide"
        visible={this.state.modalVisible}
        onRequestClose={() => this.setModalVisible(false)}>
        <View>
          <Header noShadow style={{ backgroundColor: colors.transparent }}>
            <Left />
            <Body />
            <Right>
              <NBButton transparent onPress={() => this.setModalVisible(false)}>
                <NBIcon name="close" style={{ color: colors.black }} />
              </NBButton>
            </Right>
          </Header>
          <View style={{ margin: 20 }}>
            <Text style={{ color: colors.black, fontWeight: 'bold' }}>
              Trouble logging in?
            </Text>
            <Text>Enter your email address to reset your password</Text>
          </View>

          <FormInput
            inputStyle={styles.input}
            containerStyle={{ margin: 10 }}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onBlur={this._onBlurEmailReset}
            onFocus={this._onFocusEmailReset}
            clearButtonMode="while-editing"
            keyboardType="email-address"
            returnKeyType="go"
            value={this.state.emailReset}
            onChangeText={text => this.setState({ emailReset: text })}
            underlineColorAndroid={
              hasFocusEmailReset ? colors.primary : colors.grey2
            }
          />

          <AnimButton
            disabled={
              !isEmail(this.state.emailReset) || this.state.loadingReset
            }
            // eslint-disable-next-line
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
            label="Email instructions"
            testID="ResetButton"
          />
        </View>
      </Modal>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  loadingLogin: state.LoginReducer.loading,
});

export const Login = connect(mapStateToProps)(LoginScreen);

const buttonProps = {
  foregroundColor: colors.white,
  labelStyle: { fontSize: 16 },
  maxWidth: Platform.select({
    ios: 346,
    android: 383,
  }),
};

const raised = {
  alignSelf: 'center',
  borderWidth: 0,
  borderRadius: 0,
  ...Platform.select({
    ios: {
      shadowColor: 'rgba(0,0,0, .4)',
      shadowOffset: { height: 1, width: 1 },
      // shadowOpacity: 1,
      shadowRadius: 1,
    },
    android: {
      // elevation: 2,
    },
  }),
};

const raisedActive = {
  ...Platform.select({
    ios: {
      shadowOpacity: 1,
    },
    android: {
      elevation: 2,
    },
  }),
};

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    height: 180,
  },
  input: {
    color: colors.black,
    width: '100%',
  },
  LoginButton: {
    ...raised,
  },
  PrimaryButton: {
    backgroundColor: colors.primary,
    ...raised,
    ...raisedActive,
    alignSelf: 'auto',
  },
  PDarkButton: {
    backgroundColor: colors.pDark,
    ...raised,
    ...raisedActive,
  },
  SecondaryButtonNB: {
    borderRadius: 0,
    marginTop: 10,
    padding: 15,
    alignSelf: 'center',
    backgroundColor: colors.secondary,
  },
  DisabledButton: {
    backgroundColor: colors.grey5,
  },
  DisabledButtonText: {
    color: colors.grey3,
  },
  // GoogleButton: {
  //   backgroundColor: colors.white,
  //   padding: 8,
  //   marginTop: 10,
  //   borderRadius: 0,
  //   alignSelf: 'center',
  // },
  hr: {
    alignSelf: 'center',
    margin: 10,
  },
  hrLine: {
    color: colors.grey4,
  },
});
