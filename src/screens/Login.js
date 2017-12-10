// @flow

import React from 'react';
// prettier-ignore
import {
  AsyncStorage,
  Modal,
  Platform,
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
import { Button as NBButton, Content } from 'native-base';
import { NavigationActions } from 'react-navigation';
import isEmail from 'validator/lib/isEmail';
import * as firebase from 'firebase';
import { GoogleSignin, User as GoogleUser } from 'react-native-google-signin';

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
  componentWillMount() {
    GoogleSignin.hasPlayServices({ autoResolve: true });
    GoogleSignin.configure({
      iosClientId:
        '530398476253-s5dfiv2ilfn1nbrhk5otj8k2mnne101l.apps.googleusercontent.com', // only for iOS
    });
  }

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
        if (res.data) {
          console.log('user logged in via email');
          const userData = {
            ...res.data,
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

  googleSignin() {
    console.log('googleSignin()');
    GoogleSignin.signIn().then((user: GoogleUser) => {
      const provider = firebase.auth.GoogleAuthProvider;
      const credential = provider.credential(user.idToken);
      return firebase
        .auth()
        .signInWithCredential(credential)
        .then(user => {
          console.log('signed in with Google');
          const userData = {
            emailAddress: user.email,
            provider: 'google',
          };
          this.afterLogin(userData);
        })
        .catch(error => {
          console.error(`Login fail with error: ${error}`);
        });
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
    this.setState(prevState => {
      return {
        emailReset: prevState.emailReset
          ? prevState.emailReset
          : prevState.email,
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
      <Content>
        <View style={styles.header}>
          <View style={{ alignItems: 'center' }}>
            <Icon name="flash" style={{ fontSize: 104 }} />
            <Text>Onova.co</Text>
            <View>
              <Text style={{ color: '#000' }} testID="welcome">
                Buy and sell clothes from your phone
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
            <NBButton
              style={[styles.GoogleButton, styles.raised]}
              // loading={this.state.loading}
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
      </Content>
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
