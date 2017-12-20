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

import { logout } from '../actions/actionCreator';
import colors from '../config/colors';

type Props = {
  logout: any,
  userData: any,
};

type State = {
  provider: string,
};
class Profile extends React.Component<Props, State> {
  state = {
    provider: '',
  };

  componentDidMount() {
    console.log(this.props.userData);
  }

  goToSettings() {
    // this.props.navigation.navigate('Settings');
  }

  onLogout() {
    this.props.logout({ provider: this.props.userData.provider });
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

const mapStateToProps: any = (state: any) => ({
  userData: state.LoginReducer.data,
});

const mapDispatchToProps = {
  logout,
};

const Logout = connect(mapStateToProps, mapDispatchToProps)(Profile);
export default Logout;
