// @flow

import React from 'react';
import { connect } from 'react-redux';
// prettier-ignore
import {
  Linking,
  StyleSheet,
  Text,
  View,
// $FlowFixMe
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
// prettier-ignore
import {
  Button,
  FormInput,
} from 'react-native-elements';
import { Content } from 'native-base';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';
import isEmail from 'validator/lib/isEmail';

import { logout, signup, goback } from '../actions/actionCreator';
import type { Dispatch } from '../types';
import { validPassword } from '../utils/validators';
import colors from '../config/colors';

type Props = {
  dispatch: Dispatch,
  loading: boolean,
  navigation: NavigationScreenProp,
};

type State = {
  username: string,
  emailAddress: string,
  password: string,
};

class SignupScreen extends React.Component<Props, State> {
  EmailInput: ?FormInput;
  PwdInput: ?FormInput;

  state = {
    username: 'testaccount',
    emailAddress: 'gianpa+registertest@gmail.com',
    password: '***REMOVED***99',
    // username: '',
    // email: '',
    // password: '',
    loading: false,
  };

  onSignup() {
    const { username, emailAddress, password } = this.state;
    console.log('onSignup()', username, emailAddress, password);

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

  resetNavigation() {
    // if (this.props.navigation) this.props.navigation.dispatch(resetAction);
    if (this.props.navigation) this.props.navigation.dispatch(logout());
  }

  onGoback() {
    if (this.props.navigation) this.props.navigation.dispatch(goback());
  }

  openTermPolicy() {
    Linking.openURL('https://onova.co').catch(err =>
      console.error('An error occurred', err)
    );
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
            onChangeText={text => this.setState({ username: text })}
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
            <Button
              buttonStyle={styles.SignupButton}
              raised
              loading={this.props.loading}
              disabled={
                !isEmail(this.state.emailAddress) ||
                !validPassword(this.state.password) ||
                this.state.username.length < 3 ||
                this.props.loading
              }
              onPress={() => this.onSignup()}
              title="Create account"
              accessibilityLabel="Create account"
            />
            <Text style={[styles.hr, styles.mt15]}>
              Already have an account?&nbsp;
              <Text style={styles.linkText} onPress={() => this.onGoback()}>
                Log in
              </Text>
            </Text>
            <Text style={[styles.hr, styles.mt15, { color: colors.grey1 }]}>
              By signing up you agree to the&nbsp;
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

const mapStateToProps: any = (state: any) => ({
  loading: state.LoginReducer.loading,
});

export const Signup = connect(mapStateToProps)(SignupScreen);

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
    backgroundColor: colors.pDark,
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
