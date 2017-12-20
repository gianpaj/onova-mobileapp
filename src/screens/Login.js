// @flow

import React from 'react';
import { connect } from 'react-redux';
// prettier-ignore
import {
  Modal,
  Platform,
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
import { Button as NBButton, Content } from 'native-base';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';
import isEmail from 'validator/lib/isEmail';

import { login, loginWithGoogle, goToSignup } from '../actions/actionCreator';
import type { Dispatch } from '../types';

import * as api from '../utils/api';
import * as ui from '../utils/ui';
import colors from '../config/colors';

type Props = {
  dispatch: Dispatch,
  errorMsg: string,
  loadingGoogleLogin: boolean,
  loadingLogin: boolean,
  navigation?: NavigationScreenProp,
};

type State = {
  emailAddress: string,
  emailReset: string,
  loadingReset: boolean,
  modalVisible: boolean,
  password: string,
};

class LoginScreen extends React.Component<Props, State> {
  PwdInput: ?FormInput;

  state = {
    emailAddress: 'gianpa+test2@gmail.com',
    // email: '',
    password: 'express2',
    // password: '',
    modalVisible: false,
    emailReset: '',
    loadingReset: false,
  };

  onLogin() {
    const { emailAddress, password } = this.state;
    this.props.dispatch(login({ emailAddress, password }));
  }

  onSignup() {
    if (this.props.navigation) this.props.navigation.dispatch(goToSignup());
  }

  googleSignin() {
    this.props.dispatch(loginWithGoogle());
  }

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

  // Required on Android
  _onModalDismiss() {
    console.log('modal dismissed');
  }

  onResetPassword() {
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
          ui.showToast(res.message);
        }
        console.log(res);
        this.setState({ loadingReset: false });
      })
      .catch((err: api.APIError) => {
        // if (err.status = 400) {
        ui.showToast(err.message);
        // }
        this.setState({ loadingReset: false });
      });
  }

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    clearButtonMode: 'while-editing',
    editable: !this.props.loadingLogin,
    enablesReturnKeyAutomatically: true,
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
              <Text style={{ color: colors.black }} testID="welcome">
                Buy and sell clothes from your phone
              </Text>
            </View>
          </View>
          {this.props.hasError && <Text>errors</Text>}
        </View>
        <View>
          <FormInput
            placeholder="Email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() =>
              this.PwdInput ? this.PwdInput.focus() : undefined
            }
            value={this.state.emailAddress}
            testID="EmailField"
            onChangeText={text => this.setState({ emailAddress: text })}
            {...this._inputProps}
          />
          <FormInput
            ref={c => {
              this.PwdInput = c;
            }}
            secureTextEntry
            placeholder="Password"
            returnKeyType="go"
            onSubmitEditing={() => this.onLogin()}
            value={this.state.password}
            testID="PasswordField"
            onChangeText={text => this.setState({ password: text })}
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
            <Button
              buttonStyle={styles.PrimaryButton}
              raised
              loading={this.props.loadingLogin}
              disabled={
                !this.state.emailAddress ||
                !this.state.password ||
                this.props.loadingLogin
              }
              onPress={() => this.onLogin()}
              title="Log in"
              testID="LoginButton"
            />
            <Text style={styles.hr}>
              <Text style={styles.hrLine}>────────</Text> or{' '}
              <Text style={styles.hrLine}>────────</Text>
            </Text>
            <Button
              buttonStyle={styles.PDarkButton}
              raised
              onPress={() => this.onSignup()}
              title="Sign up"
            />
            <NBButton
              style={[styles.GoogleButton, styles.raised]}
              disabled={this.props.loadingGoogleLogin}
              onPress={() => this.googleSignin()}>
              <Text>Google Login</Text>
            </NBButton>
            {/* <Footer></Footer> */}
          </View>
        </View>
        <Modal
          animationType="slide"
          visible={this.state.modalVisible}
          onRequestClose={this._onModalDismiss}>
          <View style={{ marginTop: 22 }}>
            <View style={{ alignSelf: 'center', margin: 22 }}>
              <Text style={{ fontWeight: 'bold' }}>Trouble logging in?</Text>
              <Text>
                Enter your email and we&apos;ll send a link to reset your
                password
              </Text>
            </View>

            <FormInput
              inputStyle={[styles.input]}
              containerStyle={{ margin: 10 }}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              keyboardType="email-address"
              returnKeyType="go"
              value={this.state.emailReset}
              onChangeText={text => this.setState({ emailReset: text })}
            />

            <Button
              buttonStyle={styles.PrimaryButton}
              raised
              loading={this.state.loadingReset}
              disabled={
                !isEmail(this.state.emailReset) || this.state.loadingReset
              }
              onPress={() => this.onResetPassword()}
              title="Send email"
            />
            <NBButton
              small
              style={styles.SecondaryButtonNB}
              onPress={() => {
                this.setModalVisible(!this.state.modalVisible);
              }}>
              <Text>Back To Login</Text>
            </NBButton>
          </View>
        </Modal>
      </Content>
    );
  }
}

const mapStateToProps: any = (state: any) => ({
  hasError: state.LoginReducer.hasError,
  loadingLogin: state.LoginReducer.loading,
  loadingGoogleLogin: state.LoginReducer.loadingGoogleLogin,
});

export const Login = connect(mapStateToProps)(LoginScreen);

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    height: 180,
  },
  input: {
    color: colors.black,
    width: '100%',
  },
  PrimaryButton: {
    backgroundColor: colors.primary,
  },
  PDarkButton: {
    backgroundColor: colors.pDark,
  },
  SecondaryButtonNB: {
    borderRadius: 0,
    marginTop: 10,
    padding: 15,
    alignSelf: 'center',
    backgroundColor: colors.secondary,
  },
  GoogleButton: {
    backgroundColor: colors.white,
    padding: 8,
    marginTop: 10,
    borderRadius: 0,
    alignSelf: 'center',
  },
  hr: {
    alignSelf: 'center',
    margin: 10,
  },
  hrLine: {
    color: colors.grey4,
  },
  raised: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0, .4)',
        shadowOffset: { height: 1, width: 1 },
        shadowOpacity: 1,
        shadowRadius: 1,
      },
      android: {
        backgroundColor: '#fff',
        elevation: 2,
      },
    }),
  },
});
