// @flow
import React from 'react';
import { connect } from 'react-redux';

// prettier-ignore
import {
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
  Content,
  Container,
  Header,
  Icon,
  Left,
  Right,
} from 'native-base';
// $FlowFixMe
import { NavigationActions, NavigationScreenProp } from 'react-navigation';
import NotificationsDot from '../components/NotificationsDot';

import { logout } from '../actions/actionCreator';
import colors from '../config/colors';
import type { UserData } from '../types';

type Props = {
  logout: any,
  navigation?: NavigationScreenProp,
  userData: UserData,
};

type State = {
  // provider: string,
};

class ProfileScreen extends React.Component<Props, State> {
  // state = {
  // };
  static navigationOptions = () => ({
    tabBarIcon: (props: any) => <NotificationsDot {...props} />,
  });

  componentDidMount() {
    console.log(this.props.userData);
  }

  goToSettings = () => {
    const navigateToSettings = NavigationActions.navigate({
      routeName: 'settings',
    });

    if (this.props.navigation)
      this.props.navigation.dispatch(navigateToSettings);
  };

  onLogout() {
    this.props.logout({ provider: this.props.userData.provider });
  }

  render() {
    const { username } = this.props.userData;

    return (
      <Container>
        <Header>
          <Left style={{ flex: 1 }}>{/* notifications */}</Left>
          <View>
              <Text style={{ marginTop: 15 }}>@{username}</Text>
          </View>
          <Right>
            <Button transparent onPress={this.goToSettings}>
              <Icon
                style={{ color: colors.black }}
                name={Platform.OS === 'ios' ? 'ios-cog' : 'md-cog'}
              />
            </Button>
          </Right>
        </Header>
        <Content>
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
        </Content>
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

export const Profile = connect(mapStateToProps, mapDispatchToProps)(
  ProfileScreen
);
