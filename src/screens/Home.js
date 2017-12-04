// @flow

import React from 'react';
// prettier-ignore
import {
  AsyncStorage,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
// flow-disable-next-line
} from 'react-native';
import { GoogleSignin } from 'react-native-google-signin';
import * as firebase from 'firebase';

import ImageGrid from '../components/ImageGrid';

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

  loadImages() {
    // the success and catch methods are handled by the ImageGrid component
    return fetch('https://picsum.photos/list')
      .then(res => res.json())
      .then(images => images.splice(0, 10));
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
      <View testID="Home" style={styles.container}>
        <ImageGrid loadImages={this.loadImages()} />
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
