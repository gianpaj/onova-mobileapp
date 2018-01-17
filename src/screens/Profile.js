// @flow
import React from 'react';
import { connect } from 'react-redux';

import {
  Text,
  TouchableOpacity,
  View,
  // $FlowFixMe
} from 'react-native';
// prettier-ignore
import {
  ActionSheet,
  Body,
  Button as NBButton,
  CardItem,
  Content,
  Container,
  Header,
  Icon as NBIcon,
  Left,
  Right,
} from 'native-base';
// $FlowFixMe
import { NavigationActions, NavigationScreenProp } from 'react-navigation';
import NotificationsDot from '../components/NotificationsDot';

import {
  EditableText,
  ImageGrid,
  NotificationsDot,
} from '../components';
import { getPersonalUserData, getUserData } from '../actions/actionCreator';

import colors from '../config/colors';

import type { UserData, Dispatch } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp,
  userData: UserData,
};

type State = {
  bio: string,
  displayName: string,
};

// @TODO: if Product is mine Delete, Edit
const BUTTONS = ['Report', 'Cancel'];

class ProfileScreen extends React.Component<Props, State> {
  state = {
    avatar: '',
    bio: '',
    displayName: '',
  };

  static navigationOptions = () => ({
    tabBarIcon: (props: any) => <NotificationsDot {...props} />,
  });

  componentWillMount() {
    let userId;

    const { params } = this.props.navigation.state;
    const { userData } = this.props;

    // const CancelToken = axios.CancelToken;
    // this.cancelToken = CancelToken.source();

    // if the screen navigated with an userID
    if (params && params.userID) {
      this.props.dispatch(
        getUserData(params.userId, {
          // cancelToken: this.cancelToken.token,
        })
      );
    } else {
      this.props.dispatch(
        getPersonalUserData(userData._id, {
          // cancelToken: this.cancelToken.token,
        })
      );
    }
  }

  componentWillReceiveProps(nextProps) {
    const { displayName, bio } = nextProps.userData;
    if (bio) {
      this.setState({ bio });
    }
    if (displayName) {
      this.setState({ displayName });
    }
  }

  goToSettings = () => {
    const navigateToSettings = NavigationActions.navigate({
      routeName: 'settings',
    });

      this.props.navigation.dispatch(navigateToSettings);
  };

  showActionSheet = () => {
    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: BUTTONS.indexOf('Report'),
        cancelButtonIndex: BUTTONS.indexOf('Cancel'),
      },
      buttonIndex => {
        switch (buttonIndex) {
          case BUTTONS.indexOf('Report'):
            // report action
            break;
          // case BUTTONS.indexOf('Share'):
          //   this.showShareActionSheet();
          //   break;
          default:
            console.log('Cancel');
            break;
        }
      }
    );
  };

  isMe = () => {
    const navState = this.props.navigation.state;
    if (!navState.params) {
      return false;
    }
    const { userData } = this.props;
    return navState.params.userID == userData._id;
  };

  ifNavigatedFromProduct = () => {
    const navState = this.props.navigation.state;
    return navState.params ? true : false;
  };

  openNotifications = () => {
    console.warn('code me like those french girls 🎨');
  };

  render() {
    const { _id, username, bio } = this.props.userData;

    return (
      <Container>
        <Header>
          <Left style={styles.flex1}>
            {this.ifNavigatedFromProduct() ? (
              <NBButton
                transparent
                dark
                onPress={() => this.props.navigation.goBack()}>
                <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
              </NBButton>
            ) : (
              <NBButton transparent dark onPress={this.openNotifications}>
                <NBIcon
                  style={{ fontSize: 27 }}
                  ios="ios-notifications"
                  android="md-notifications"
                />
              </NBButton>
            )}
          </Left>
          <View>
              <Text style={{ marginTop: 15 }}>@{username}</Text>
          </View>
          <Right>
            {this.ifNavigatedFromProduct() ? (
              <NBButton transparent dark onPress={this.showActionSheet}>
                <NBIcon ios="ios-more" android="md-more" />
              </NBButton>
            ) : (
              <NBButton transparent onPress={this.goToSettings}>
                <NBIcon
                  ios="ios-cog"
                  android="md-cog"
                style={{ color: colors.black }}
              />
              </NBButton>
            )}
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
            <View style={styles.flex1}>
              <EditableText
                text={this.state.displayName} //required
                sendText={t => this.setState({ displayName: t })} //required
                // loading={this.isLoading} //optional false
                isTextEditable={true} // optional true
                textInputProps={{ style: { color: colors.red } }}
              />
              </View>
            </Body>
          </CardItem>
          <CardItem>
          </CardItem>
        </Content>
        <ImageGrid
          apiURL={`/api/products?userid=${_id}`}
          navigation={this.props.navigation}
        />
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
const mapStateToProps: any = (state: any) => ({
  userData: state.LoginReducer.data,
});

export const Profile = connect(mapStateToProps)(ProfileScreen);
