// @flow

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import {
  Button,
  FormInput,
} from 'react-native-elements';
import { NavigationActions } from 'react-navigation';

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
    loadingReset: false
  }

  onLogin() {
    this.setState({ loadingLogin: true });
    console.log('onLogin', this.state.email, this.state.password);
    api
      .post('/api/auth/login', {
        emailAddress: this.state.email,
        password:     this.state.password
      })
      .then(res => {
        if (res.user) {
          console.log('user logged in', res.user);
          console.log('token', res.token);
          this.setState({ loadingLogin: false });
          this.resetNavigation('Tabs');
        } else {
          this.setState({ loadingLogin: false });
          console.log(res);
          // ui.showToast(res.toString());
        }
      })
      .catch((err: api.APIError) => {
        if (err.status = 400) {
          ui.showToast(err.message);
        }
        this.setState({ loadingLogin: false })
      });
  }

  resetNavigation(targetRoute: any) {
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({ routeName: targetRoute }),
      ],
    });
    this.props.navigation.dispatch(resetAction);
  }

  setModalVisible(visible: boolean) {
    this.setState({ modalVisible: visible });
  }

  onResetPassword() {
    this.setState({ loadingReset: true });
  }

  render() {
    return (
      <View>
        <View style={styles.header}>
          <View style={{ alignItems: 'center' }}>
            <Icon name='flash' style={{ fontSize: 104 }} />
            <Text>Onova.co</Text>
            <View>
              <Text style={{ color: '#000' }}>
                Discover and Buy Amazing Clothing
              </Text>
            </View>
          </View>
        </View>
        <View>
          <FormInput
            inputStyle={styles.input}
            placeholder='Email'
            autoCapitalize='none'
            autoCorrect={false}
            keyboardType='email-address'
            returnKeyType='next'
            onSubmitEditing={(event) =>
              this.refs.PwdInput.focus()
            }
            value={this.state.email}
            onChangeText={(text) => this.setState({'email': text})}
            />
          <FormInput
            ref='PwdInput'
            inputStyle={styles.input}
            secureTextEntry
            autoCorrect={false}
            placeholder='Password'
            autoCapitalize='none'
            returnKeyType='go'
            value={this.state.password}
            onChangeText={(text) => this.setState({'password': text})}
          />
          {<Text style={styles.hr}
            onPress={() => {this.setModalVisible(true)}}
            >Forgot Password?</Text>}
          <View style={{ marginTop: 15 }}>
            <Button
              buttonStyle={styles.LoginButton}
              raised
              loading={this.state.loadingLogin}
              disabled={!this.state.email || !this.state.password || this.state.loadingLogin}
              onPress={() => this.onLogin()}
              title='Login' />
            <Text style={styles.hr}><Text style={styles.hrLine}>────────</Text> or <Text style={styles.hrLine}>────────</Text></Text>
            <Button
              buttonStyle={styles.SignupButton}
              raised
              onPress={() => this.props.navigation.navigate('Signup')}
              title='Signup' />
            {/* <Footer></Footer> */}
          </View>
        </View>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {alert("Modal has been closed.")}}
          >
         <View style={{marginTop: 22}}>
          <View>
            <View style={{ alignSelf: 'center' }}>
              <Text style={{ fontWeight: 'bold' }}>Trouble loggin in?</Text>
              <Text>Enter your email and we'll send a link to reset your password</Text>
            </View>

            <FormInput
              inputStyle={styles.input}
              placeholder='Email'
              autoCapitalize='none'
              autoCorrect={false}
              keyboardType='email-address'
              returnKeyType='go'
              value={this.state.emailReset}
              onChangeText={(text) => this.setState({'emailReset': text})}
              />

            <Button
              buttonStyle={styles.LoginButton}
              loading={this.state.loadingReset}
              disabled={!this.state.emailReset || this.state.loadingReset}
              onPress={() => this.onResetPassword()}
              title="Send email" />
            <Button
              onPress={() => {this.setModalVisible(!this.state.modalVisible)}}
              title="Back To Login" />
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
    color: colors.black
  },
  LoginButton: {
    backgroundColor: colors.primary,
  },
  SignupButton: {
    backgroundColor: colors.pDark,
  },
  hr: {
    alignSelf: 'center',
    margin: 10,
  },
  hrLine: {
    color: colors.grey4,
  }
});
