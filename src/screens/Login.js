// @flow

import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import {
  Button,
  FormInput,
  FormLabel,
} from 'react-native-elements';
import colors from '../config/colors';

export default class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      emailValue: '',
      passValue: '',
      enableLogin: false,
    };
  }

  onChange(key: string, value: string) {
    this.setState({
      [key]: value
    });
  }

  onLogin() {
    console.log('onLogin', this.state.emailValue, this.state.passValue);
  }

  render() {
    return (
      <View>
        <View style={styles.header}>
          <View style={{ alignItems: "center" }}>
            <Icon name="flash" style={{ fontSize: 104 }} />
            <Text>Onova.co</Text>
            <View>
              <Text style={{ color: Platform.OS === "ios" ? "#000" : "#FFF" }}>
                Re-sell Something Amazing
              </Text>
            </View>
          </View>
        </View>
        <View>
          {/* {this.props.loginForm} */}
          <FormInput
            inputStyle={styles.input}
            // ref="form2"
            // containerRef="containerRefYOYO"
            // textInputRef="textInputRef"
            placeholder="Email"
            autoCapitalize="none"
            value={this.state.emailValue}
            onChangeText={text => this.onChange('emailValue', text)}
            />
          <FormInput
            inputStyle={styles.input}
            // ref="form2"
            // containerRef="containerRefYOYO"
            // textInputRef="textInputRef"
            placeholder="Password"
            autoCapitalize="none"
            value={this.state.passValue}
            onChangeText={text => this.onChange('passValue', text)}
          />
          <View style={{ marginTop: 15 }}>
            <Button
              buttonStyle={styles.LoginButton}
              raised
              // disabled={!this.state.enableLogin}
              disabled={!this.state.emailValue || !this.state.passValue}
              onPress={() => this.onLogin()}
              title='Login' />
            <Text style={styles.hr}>- or -</Text>
            <Button
              buttonStyle={styles.SignupButton}
              raised
              title='Signup' />
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
  LoginButton: {
    backgroundColor: colors.primary,
  },
  SignupButton: {
    backgroundColor: colors.pDark,
  },
  hr: {
    alignSelf: "center",
    margin: 5,
  }
});
