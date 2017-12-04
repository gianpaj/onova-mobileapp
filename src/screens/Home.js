// @flow
import colors from '../config/colors';

import React from 'react';
// prettier-ignore
import {
  AsyncStorage,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
// prettier-ignore
import {
  Container,
  ScrollableTab,
  Tab,
  Tabs,
 } from 'native-base';
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
      <Container testID="Home" style={styles.container}>
        <View style={styles.statusBarUnderlay} />
        <Tabs
          style={{ backgroundColor: colors.bgDefault }}
          renderTabBar={() => <ScrollableTab />}>
          <Tab heading="Tab1">
            <ImageGrid URL="https://picsum.photos/list" />
          </Tab>
          <Tab heading="Tab2">
            <ImageGrid URL="https://picsum.photos/list" />
          </Tab>
        </Tabs>
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
      </Container>
    );
  }
}

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

const styles = StyleSheet.create({
  statusBarUnderlay: {
    marginTop: STATUS_BAR_HEIGHT,
  },
  container: {
    backgroundColor: colors.bgDefault,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
