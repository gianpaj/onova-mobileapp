// @flow
import React from 'react';
import { connect } from 'react-redux';

// prettier-ignore
import {
  AsyncStorage,
  Platform,
  Text,
  View,
  // $FlowFixMe
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

import { logout } from '../actions/actionCreator';
import colors from '../config/colors';

const USER_KEY = 'userData';

type Props = {
  logout: any,
};

type UserData = {
  emailAddress: string,
};

type State = {
  provider: string,
  userData: any,
};
class Profile extends React.Component<Props, State> {
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
    // this.props.navigation.navigate('Settings');
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
        this.props.logout();
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

const mapDispatchToProps = {
  logout,
};

const Logout = connect(null, mapDispatchToProps)(Profile);
export default Logout;
