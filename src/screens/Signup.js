// @flow

import React from 'react';
// prettier-ignore
import {
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
// $FlowFixMe
import { NavigationActions } from 'react-navigation';
import isEmail from 'validator/lib/isEmail';

import * as api from '../utils/api';
import * as ui from '../utils/ui';
import colors from '../config/colors';

type Props = {
  navigation: any,
};

type State = {
  username: string,
  email: string,
  password: string,
  loading: boolean,
};

export default class LoginScreen extends React.Component<Props, State> {
  EmailInput: ?FormInput;
  PwdInput: ?FormInput;

  state = {
    username: '',
    email: '',
    password: '',
    loading: false,
  };

  onSignup() {
    this.setState({ loading: true });
    console.log('onSignup', this.state.email, this.state.password);

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

    api
      .post('/api/users', {
        username: this.state.username,
        emailAddress: this.state.email,
        password: this.state.password,
      })
      .then(res => {
        if (res.user) {
          console.log('user created', res.user);
          console.log('token', res.token);
          this.resetNavigation('Tabs');
        } else {
          console.log(res);
          // ui.showToast(res.toString());
        }
        this.setState({ loading: false });
      })
      .catch((err: api.APIError) => {
        if (err.status == 400) {
          ui.showToast(err.message);
        }
        this.setState({ loading: false });
      });
  }

  resetNavigation(targetRoute: string) {
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: targetRoute })],
    });
    this.props.navigation.dispatch(resetAction);
  }

  _inputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    clearButtonMode: 'while-editing',
    editable: !this.state.loading,
    inputStyle: styles.input,
  };

  render() {
    return (
      <View>
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
        <View>
          <FormInput
            placeholder="Username"
            returnKeyType="next"
            onSubmitEditing={() =>
              this.EmailInput ? this.EmailInput.focus() : null
            }
            value={this.state.username}
            onChangeText={text => this.setState({ username: text })}
            {...this._inputProps}
          />
          <FormInput
            ref={c => {
              this.EmailInput = c;
            }}
            placeholder="Email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() =>
              this.PwdInput ? this.PwdInput.focus() : null
            }
            value={this.state.email}
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
            onSubmitEditing={() => this.onSignup()}
            value={this.state.password}
            onChangeText={text => this.setState({ password: text })}
            {...this._inputProps}
          />
          <View style={{ marginTop: 15 }}>
            <Button
              buttonStyle={styles.SignupButton}
              raised
              loading={this.state.loading}
              disabled={
                !isEmail(this.state.email) ||
                this.state.password.length < 9 ||
                this.state.username.length < 3
              }
              onPress={() => this.onSignup()}
              title="Signup"
            />
            <Text style={styles.hr}>
              Already have an account?&nbsp;
              <Text
                style={styles.linkText}
                onPress={() => this.props.navigation.goBack()}>
                Login
              </Text>
            </Text>
          </View>
        </View>
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
    width: '100%',
  },
  SignupButton: {
    backgroundColor: colors.pDark,
  },
  hr: {
    alignSelf: 'center',
    margin: 5,
  },
  linkText: {
    margin: 5,
    color: colors.secondary,
  },
});
