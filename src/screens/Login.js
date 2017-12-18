// @flow

import React from 'react';
import { connect } from 'react-redux';
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

import { login } from '../actions/actionCreator';

import * as api from '../utils/api';
import * as ui from '../utils/ui';
import colors from '../config/colors';

type Props = {
  navigation: any,
  loadingLogin: true,
  login(): any,
};

type State = {
  email: string,
  password: string,
  modalVisible: boolean,
  emailReset: string,
  loadingLogin: boolean,
  loadingReset: boolean,
};

class LoginScreen extends React.Component<Props, State> {
  componentWillMount() {
    GoogleSignin.hasPlayServices({ autoResolve: true });
    GoogleSignin.configure({
      iosClientId:
        '530398476253-s5dfiv2ilfn1nbrhk5otj8k2mnne101l.apps.googleusercontent.com', // only for iOS
    });
  }

  state = {
    email: 'gianpa+test2@gmail.com',
    // email: '',
    password: 'express2',
    // password: '',
    modalVisible: false,
    emailReset: '',
    loadingReset: false,
  };

  onLogin() {
    console.log('onLogin()', this.state.email, this.state.password);
    this.props.login({
      emailAddress: this.state.email,
      password: this.state.password,
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
      // this.resetNavigation('Tabs');
    });
  }

  // resetNavigation(targetRoute: any) {
  //   const resetAction = NavigationActions.reset({
  //     index: 0,
  //     actions: [NavigationActions.navigate({ routeName: targetRoute })],
  //   });
  //   this.props.navigation.dispatch(resetAction);
  // }

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

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    clearButtonMode: 'while-editing',
    editable: !this.state.loading,
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
              <Text style={{ color: '#000' }} testID="welcome">
                Buy and sell clothes from your phone
              </Text>
            </View>
          </View>
          {/* {this.props.hasError && <Text>errors</Text>} */}
        </View>
        <View>
          <FormInput
            placeholder="Email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => this.PwdInput.focus()}
            value={this.state.email}
            testID="EmailField"
            onChangeText={text => this.setState({ email: text })}
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
                !this.state.email ||
                !this.state.password ||
                this.props.loadingLogin
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

const mapStateToProps = state => ({
  loadingLogin: state.LoginReducer.loading,
  hasError: state.LoginReducer.hasError,
});

const mapActionsToProps = dispatch => ({
  login(data) {
    dispatch(login(data));
  },
});

const Login = connect(mapStateToProps, mapActionsToProps)(LoginScreen);

export default Login;

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
