// @flow

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import {
  Button,
  FormInput,
} from 'react-native-elements';
import { Toast } from "native-base";
import { NavigationActions } from 'react-navigation';

import * as api from '../utils/api';
import colors from '../config/colors';

export interface APIError {
  status: number,
  message: string
}

export default class LoginScreen extends React.Component {
  state = {
    email: '',
    password: '',
    loading: false
  }

  onSignup() {
    this.setState({ loading: true })
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
        username:     this.state.username,
        emailAddress: this.state.email,
        password:     this.state.password
      })
      .then(res => {
        if (res.user) {
          console.log('user created', res.user);
          console.log('token', res.token);
          this.resetNavigation('Tabs');
        } else {
          console.log(res);
          // Toast.show({
          //   text: res.toString(),
          //   duration: 2000,
          //   position: "top",
          //   textStyle: { textAlign: "center" },
          // });
        }
        this.setState({ loading: false });
      })
      .catch((err: APIError) => {
        if (err.status = 400) {
          Toast.show({
            text: err.message,
            duration: 2000,
            position: "top",
            textStyle: { textAlign: "center" },
          });
        }
        this.setState({ loading: false })
      });
  }

  resetNavigation(targetRoute) {
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({ routeName: targetRoute }),
      ],
    });
    this.props.navigation.dispatch(resetAction);
  }

  render() {
    return (
      <View>
        <View style={styles.header}>
          <View style={{ alignItems: "center" }}>
            <Icon name="flash" style={{ fontSize: 104 }} />
            <Text>Onova.co</Text>
            <View>
              <Text style={{ color: "#000" }}>
              Discover and Buy Amazing Clothing
              </Text>
            </View>
          </View>
        </View>
        <View>
          <FormInput
            inputStyle={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={(event) =>
              this.refs.EmailInput.focus()
            }
            value={this.state.username}
            onChangeText={(text) => this.setState({'username': text})}
            />
          <FormInput
            ref="EmailInput"
            inputStyle={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={(event) =>
              this.refs.PwdInput.focus()
            }
            value={this.state.email}
            onChangeText={(text) => this.setState({'email': text})}
            />
          <FormInput
            ref="PwdInput"
            inputStyle={styles.input}
            secureTextEntry
            autoCorrect={false}
            placeholder="Password"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={(event) =>
              this.refs.PwdAgainInput.focus()
            }
            value={this.state.password}
            onChangeText={(text) => this.setState({'password': text})}
          />
          <View style={{ marginTop: 15 }}>
            <Button
              buttonStyle={styles.SignupButton}
              raised
              loading={this.state.loading}
              disabled={ !this.state.email || !this.state.password }
              onPress={() => this.onSignup()}
              title='Signup' />
            <Text style={styles.hr}>Already have an account? <Text
              style={styles.linkText}
              onPress={() => this.props.navigation.goBack()}
              >Login</Text></Text>
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
    color: colors.black
  },
  SignupButton: {
    backgroundColor: colors.pDark,
  },
  hr: {
    alignSelf: "center",
    margin: 5,
  },
  linkText: {
    margin: 5,
    color: colors.secondary
  }
});
