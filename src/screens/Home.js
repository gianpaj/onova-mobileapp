// @flow

import React from 'react';
// prettier-ignore
import {
  AsyncStorage,
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import { GoogleSignin } from 'react-native-google-signin';
import * as firebase from 'firebase';

type Props = {
  navigation: any,
};

type State = {
  provider: string,
};
export default class HomeScreen extends React.Component<Props, State> {
  state = {
    provider: '',
  };

  componentWillMount() {
    AsyncStorage.getItem('userData').then(userData => {
      const jsonData = JSON.parse(userData);
      // console.log(jsonData);
      this.setState({ provider: jsonData.provider });
    });
  }

  onLogout() {
    AsyncStorage.removeItem('userData')
      .then(() => {
        this.props.navigation.navigate('Login');
      })
      .catch(err => {
        console.error(err);
      });
  }

  onGoogleLogout() {
    GoogleSignin.signOut()
      .then(() => firebase.auth().signOut())
      .then(() => AsyncStorage.removeItem('userData'))
      .then(() => {
        console.log('out');
        this.props.navigation.navigate('Login');
      })
      .catch(err => {
        console.error(err);
      });
  }

  render() {
    const { provider } = this.state;

    return (
      <View
        testID="Home"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        {provider == 'email' && (
          <TouchableOpacity onPress={() => this.onLogout()}>
            <Text>Logout</Text>
          </TouchableOpacity>
        )}
        {provider == 'google' && (
          <TouchableOpacity onPress={() => this.onGoogleLogout()}>
            <Text>Google Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}
