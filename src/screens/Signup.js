// @flow

import React from 'react';
import { connect } from 'react-redux';
// prettier-ignore
import {
  Animated,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import { FormInput } from 'react-native-elements';
// $FlowFixMe
import AnimButton from 'react-native-micro-animated-button';
import { Content } from 'native-base';
import type { NavigationScreenProp } from 'react-navigation';
import isEmail from 'validator/lib/isEmail';

import { signup, goback } from '../actions/actionCreator';
import type { Dispatch, ReduxState } from '../types';
import { validPassword } from '../utils/validators';
import colors from '../config/colors';
import settings from '../config/settings';

type Props = {
  dispatch: Dispatch,
  loading: boolean,
  navigation: NavigationScreenProp<*>,
};

type State = {
  username: string,
  emailAddress: string,
  password: string,
  loading: false,
  usernameError: boolean,
  disabled: boolean,
};

class SignupScreen extends React.Component<Props, State> {
  EmailInput: ?FormInput;
  signupBtn;
  PwdInput: ?FormInput;
  animatedValue = new Animated.Value(0);
  backgroundColor = this.animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.grey4, colors.primary],
  });

  state = {
    username: 'testaccount',
    emailAddress: 'gianpa+test2@gmail.com',
    password: 'express2',
    // username: '',
    // email: '',
    // password: '',
    loading: false,
    usernameError: false,
    disabled: true,
  };

  onSignup() {
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

    this.props.dispatch(signup({ username, emailAddress, password }));
  }

  onUserChange = (u: string) => {
    if (!settings.USERNAME_REGEX.test(u)) {
      this.setState({ usernameError: true });
    } else {
      return this.setState({ username: u });
    }

    setTimeout(() => {
      this.setState({ usernameError: false });
    }, 100);
  };

  openTermPolicy() {
    Linking.openURL('https://onova.co').catch(err =>
      console.error('An error occurred', err)
    );
  }

  componentWillUpdate(nextProps, nextState) {
    const { loading } = nextProps;
    const {
      emailAddress: emailAddressNext,
      password: passwordNext,
      disabled: disabledNext,
      username: usernameNext,
    } = nextState;
    const { emailAddress, password, disabled, username } = this.state;

    if (!loading && this.signupBtn) {
      this.signupBtn.reset();
    }

    if (
      emailAddressNext !== emailAddress ||
      passwordNext !== password ||
      usernameNext !== username ||
      disabledNext !== disabled
    ) {
      if (
        !isEmail(emailAddressNext) ||
        !validPassword(passwordNext) ||
        usernameNext.length < 3 ||
        loading
      ) {
        this.setState({ disabled: true });
        Animated.timing(this.animatedValue, {
          toValue: 0,
          duration: 300,
        }).start();
      } else {
        this.setState({ disabled: false });
        Animated.timing(this.animatedValue, {
          toValue: 1,
          duration: 300,
        }).start();
      }
    }
  }

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    clearButtonMode: 'while-editing',
    editable: !this.props.loading,
    inputStyle: styles.input,
  };

  render() {
    return (
      <Content>
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
        <View testID="signup-form">
          <FormInput
            placeholder="Username"
            returnKeyType="next"
            onSubmitEditing={() => this.EmailInput && this.EmailInput.focus()}
            value={this.state.username}
            onChangeText={t => this.onUserChange(t)}
            accessibilityLabel="username"
            {...this._inputProps}
          />
          <FormInput
            ref={c => {
              this.EmailInput = c;
            }}
            placeholder="Email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => this.PwdInput && this.PwdInput.focus()}
            value={this.state.emailAddress}
            testID="EmailField"
            onChangeText={text => this.setState({ emailAddress: text })}
            accessibilityLabel="email address"
            {...this._inputProps}
          />
          <FormInput
            ref={c => {
              this.PwdInput = c;
            }}
            secureTextEntry
            placeholder="Password (minimum 8 characters)"
            returnKeyType="go"
            onSubmitEditing={() => this.onSignup()}
            value={this.state.password}
            onChangeText={text => this.setState({ password: text })}
            accessibilityLabel="password"
            {...this._inputProps}
          />
          <View style={styles.mt15}>
            <AnimButton
              ref={r => (this.signupBtn = r)}
              disabled={this.state.disabled}
              // eslint-disable-next-line
              style={[styles.SignupButton, {
                  backgroundColor: this.backgroundColor,
                  elevation: this.animatedValue, // android
                  shadowOpacity: this.animatedValue, // ios
                },
              ]}
              {...buttonProps}
              onPress={() => this.onSignup()}
              testID="SignupButton"
              label="Create account"
              accessibilityLabel="Create account"
            />
            <Text style={[styles.hr, styles.mt15]}>
              Already have an account?&nbsp;
              <Text
                style={styles.linkText}
                onPress={() => this.props.navigation.dispatch(goback())}>
                Log in
              </Text>
            </Text>
            <Text style={[styles.hr, styles.mt15, { color: colors.grey1 }]}>
              By creating an account you agree to the&nbsp;
              <Text
                style={[styles.linkText, styles.termsLink]}
                onPress={this.openTermPolicy}>
                Terms and Policy
              </Text>
            </Text>
          </View>
        </View>
      </Content>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  loading: state.LoginReducer.loading,
});

export const Signup = connect(mapStateToProps)(SignupScreen);

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

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    height: 180,
  },
  input: {
    color: colors.black,
    width: '100%',
  },
  SignupButton: {
    ...raised,
  },
  hr: {
    alignSelf: 'center',
    margin: 5,
  },
  mt15: {
    marginTop: 15,
  },
  linkText: {
    fontWeight: 'bold',
    margin: 5,
  },
  termsLink: {
    fontWeight: 'bold',
    color: colors.grey2,
  },
});
