// @flow
import colors from '../config/colors';

import React from 'react';
// prettier-ignore
import {
  AsyncStorage,
  Platform,
  Text,
  View,
} from 'react-native';
// prettier-ignore
import {
  Body,
  Button,
  Card,
  CardItem,
  Container,
  Header,
  Icon,
  Left,
  Right,
} from 'native-base';
import { GoogleSignin } from 'react-native-google-signin';
import * as firebase from 'firebase';

const USER_KEY = 'userData';

type Props = {
  navigation: any,
};

type UserData = {
  emailAddress: string,
};

type State = {
  provider: string,
  userData: any,
};
export default class HomeScreen extends React.Component<Props, State> {
  state = {
    provider: '',
    userData: {},
  };

  componentDidMount() {
    AsyncStorage.getItem(USER_KEY).then(userData => {
      const jsonData = JSON.parse(userData);
      console.log(jsonData);
      this.setState({ provider: jsonData.provider });
      this.setState({ userData: jsonData });
    });
  }

  goToSettings() {
    this.props.navigation.navigate('Settings');
  }

  onLogout() {
    if (this.state.provider == 'email') {
      this.afterLogout();
    } else {
      this.onGoogleLogout();
    }
  }

  afterLogout() {
    return AsyncStorage.removeItem(USER_KEY)
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
      .then(() => AsyncStorage.removeItem(USER_KEY))
      .then(() => this.afterLogout());
  }

  render() {
    // const { username } = this.state.userData;

    return (
      <Container>
        <Header>
          <Left />
          {/* notifications */}
          <View>
            <Text style={{ marginTop: 15 }}>@username</Text>
            {/* <Text style={{ marginTop: 15 }}>@{username}</Text> */}
          </View>
          <Right>
            <Button transparent onPress={this.goToSettings()}>
              <Icon
                style={{ color: colors.black }}
                name={Platform.OS === 'ios' ? 'ios-cog' : 'md-cog'}
              />
            </Button>
          </Right>
        </Header>
        <Card>
          <CardItem>
            <Body>
              <View
                style={{
                  backgroundColor: '#bcbec1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignSelf: 'center',
                  marginBottom: 20,
                }}>
                <Text style={{ color: 'white', fontSize: 28 }}>JD</Text>
              </View>

              {/* {provider == 'email' && (
            <TouchableOpacity onPress={() => this.onLogout()}>
              <Text>Logout</Text>
            </TouchableOpacity>
          )}
          {provider == 'google' && (
            <TouchableOpacity onPress={() => this.onGoogleLogout()}>
              <Text>Google Logout</Text>
            </TouchableOpacity>
          )} */}
            </Body>
          </CardItem>
          <CardItem>
            <Button primary onPress={() => this.onLogout()}>
              <Text>Sign out</Text>
            </Button>
          </CardItem>
        </Card>
      </Container>
    );
  }
}
