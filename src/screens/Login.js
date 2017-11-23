// @flow

import React from 'react';
// prettier-ignore
import {
  AsyncStorage,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
// prettier-ignore
import {
  Button,
  FormInput,
} from 'react-native-elements';
import { Button as NBButton } from 'native-base';
import { NavigationActions } from 'react-navigation';
import isEmail from 'validator/lib/isEmail';

import * as api from '../utils/api';
import * as ui from '../utils/ui';
import colors from '../config/colors';

type Props = {
  navigation: any,
};

type State = {
  email: string,
  password: string,
  modalVisible: boolean,
  emailReset: string,
  loadingLogin: boolean,
  loadingReset: boolean,
};

export default class LoginScreen extends React.Component<Props, State> {
  state = {
    email: 'hello@gmail.com',
    // email: '',
    password: '***REMOVED***',
    // password: '',
    modalVisible: false,
    emailReset: '',
    loadingLogin: false,
    loadingReset: false,
  };

  onLogin() {
    this.setState({ loadingLogin: true });
    console.log('onLogin()', this.state.email, this.state.password);
    api
      .post('/api/auth/login', {
        emailAddress: this.state.email,
        password: this.state.password,
      })
      .then(res => {
        if (res.user) {
          console.log('user logged in via email');
          const userData = {
            ...res.user,
            ...{ token: res.token, provider: 'email' },
          };
          this.afterLogin(userData);
        } else {
          this.setState({ loadingLogin: false });
          console.log(res);
          // ui.showToast(res.toString());
        }
      })
      .catch((err: api.APIError) => {
        if (err.status == 400 || err.status == 500) {
          ui.showToast(err.message, 'danger');
        }
        console.log(err);
        this.setState({ loadingLogin: false });
      });
  }

  afterLogin(userData: any) {
    console.log('afterLogin()');
    console.log(userData);
    const JSONstring = JSON.stringify(userData);
    return AsyncStorage.setItem('userData', JSONstring).then(() => {
      ui.showToast('Welcome!');
      this.setState({ loadingLogin: false });
      this.resetNavigation('Tabs');
    });
  }

  resetNavigation(targetRoute: any) {
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: targetRoute })],
    });
    this.props.navigation.dispatch(resetAction);
  }

  setModalVisible(visible: boolean) {
    this.setState({
      emailReset: this.state.emailReset
        ? this.state.emailReset
        : this.state.email,
      modalVisible: visible,
    });
  }

  onResetPassword() {
    if (!isEmail(this.state.emailReset)) {
      return;
    }

    this.setState({ loadingReset: true });
    api
      .post('/api/auth/reset', {
        emailAddress: this.state.email,
      })
      .then(res => {
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

  render() {
    return (
      <View>
        <View style={styles.header}>
          <View style={{ alignItems: 'center' }}>
            <Icon name="flash" style={{ fontSize: 104 }} />
            <Text>Onova.co</Text>
            <View>
              <Text style={{ color: '#000' }} testID="welcome">
                Discover and Buy Amazing Clothing
              </Text>
            </View>
          </View>
        </View>
        <View>
          <FormInput
            inputStyle={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => this.PwdInput.focus()}
            enablesReturnKeyAutomatically
            value={this.state.email}
            editable={!this.state.loadingLogin}
            testID="EmailField"
            onChangeText={text => this.setState({ email: text })}
          />
          <FormInput
            ref={c => {
              this.PwdInput = c;
            }}
            inputStyle={styles.input}
            secureTextEntry
            placeholder="Password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => this.onLogin()}
            enablesReturnKeyAutomatically
            value={this.state.password}
            editable={!this.state.loadingLogin}
            testID="PasswordField"
            onChangeText={text => this.setState({ password: text })}
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
              loading={this.state.loadingLogin}
              disabled={
                !this.state.email ||
                !this.state.password ||
                this.state.loadingLogin
              }
              onPress={() => this.onLogin()}
              title="Login"
              testID="LoginButton"
            />
            <Text style={styles.hr}>
              <Text style={styles.hrLine}>────────</Text> or{' '}
              <Text style={styles.hrLine}>────────</Text>
            </Text>
            <Button
              buttonStyle={styles.PDarkButton}
              raised
              onPress={() => this.props.navigation.navigate('Signup')}
              title="Signup"
            />
            {/* <Footer></Footer> */}
          </View>
        </View>
        <Modal animationType="slide" visible={this.state.modalVisible}>
          <View style={{ marginTop: 22 }}>
            <View>
              <View style={{ alignSelf: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>Trouble logging in?</Text>
                <Text>
                  Enter your email and we&apos;ll send a link to reset your
                  password
                </Text>
              </View>

              <FormInput
                inputStyle={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                autoCorrect={false}
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
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    height: 180,
  },
  input: {
    color: colors.black,
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
  hr: {
    alignSelf: 'center',
    margin: 10,
  },
  hrLine: {
    color: colors.grey4,
  },
});
