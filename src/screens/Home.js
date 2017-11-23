// @flow

import React from 'react';
// prettier-ignore
import {
  AsyncStorage,
  View,
  Text,
  TouchableOpacity
} from 'react-native';


type Props = {
  navigation: any,
};
export default class HomeScreen extends React.Component<Props, State> {

  onLogout() {
    AsyncStorage.removeItem('userData')
      .then(() => {
        this.props.navigation.navigate('Login');
      })
      .catch(err => {
        console.error(err);
      });
  }

  render() {
    return (
      <View
        testID="Home"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <TouchableOpacity onPress={() => this.onLogout()}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
