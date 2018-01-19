// @flow
import React from 'react';
import { connect } from 'react-redux';

import {
  StyleSheet,
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
  Card,
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

import {
  Avatar,
  EditableText,
  ImageGrid,
  NotificationsDot,
} from '../components';
import { getPersonalUserData, getUserData } from '../actions/actionCreator';

import colors from '../config/colors';
import * as ui from '../utils/ui';

import type { UserData, Dispatch } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp,
  userData: UserData,
};

type State = {
  bio: string,
  displayName: string,
  profilePic: string,
  editing: boolean,
};

// @TODO: if Product is mine Delete, Edit
const BUTTONS = ['Report', 'Cancel'];

class ProfileScreen extends React.Component<Props, State> {
  state = {
    bio: '',
    displayName: '',
    editing: false,
    following: false,
    profilePic: '',
  };

  static navigationOptions = () => ({
    tabBarIcon: (props: any) => <NotificationsDot {...props} />,
  });

  componentWillMount() {
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

  componentWillUnmount() {
    this.setState({ editing: false });
  }

  componentWillReceiveProps(nextProps) {
    const { bio, displayName, profilePic } = nextProps.userData;
    if (bio !== undefined) {
      this.setState({ bio });
    }
    if (displayName !== undefined) {
      this.setState({ displayName });
    }
    if (profilePic !== undefined) {
      this.setState({ profilePic });
    }
  }

  onGoToSettings = () => {
    if (this.hasUnsavedChanges()) {
      ui.showConfirmAlert(
        'Unsaved Changes',
        'Are you sure you want to Cancel?',
        () => {
          // on dismiss
          this.goToSettings();
        }
      );
    } else {
      this.goToSettings();
    }
  };

  goToSettings = () => {
    const navigateToSettings = NavigationActions.navigate({
      routeName: 'settings',
    });
    this.props.navigation.dispatch(navigateToSettings);
  };

  hasUnsavedChanges(): boolean {
    const { userData } = this.props;
    const { bio, displayName, profilePic } = this.state;

    return (
      (bio !== userData.bio && bio !== '') ||
      (displayName !== userData.displayName && displayName !== '') ||
      profilePic !== ''
    );
  }

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
          default:
            console.debug('Cancel');
            break;
        }
      }
    );
  };

  isMe(): boolean {
    const navState = this.props.navigation.state;
    if (!navState.params) {
      return true;
    }

    const { userData } = this.props;
    return navState.params.userID == userData._id;
  }

  ifNavigatedFromProduct = () => {
    const navState = this.props.navigation.state;
    return navState.params ? true : false;
  };

  openNotifications = () => {
    console.warn('code me like those french girls 🎨');
  };

  render() {
    const { _id, username } = this.props.userData;
    const { bio, displayName, editing, profilePic, following } = this.state;

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
                  ios="ios-notifications"
                  android="md-notifications"
                  style={styles.icon}
                />
              </NBButton>
            )}
          </Left>
          <View>
            <Text style={styles.username}>@{username}</Text>
          </View>
          <Right>
            {this.ifNavigatedFromProduct() ? (
              <NBButton transparent dark onPress={this.showActionSheet}>
                <NBIcon ios="ios-more" android="md-more" />
              </NBButton>
            ) : (
              <NBButton transparent onPress={this.onGoToSettings}>
                <NBIcon ios="ios-cog" android="md-cog" style={styles.icon} />
              </NBButton>
            )}
          </Right>
        </Header>
        <View>
          <View style={styles.profileTop}>
            <View>
              <View style={styles.row}>
                <Avatar
                  style={styles.avatarContainer}
                  size={'default'}
                  withBorder
                  onChange={p => this.setState({ profilePic: p.sourceURL })}
                  interactive={editing}
                  uri={profilePic}
                  placeholderText={username[0]}
                />
                <View style={styles.flex1}>
                  {this.isMe() ? (
                    <View style={styles.profileRight}>
                      <EditableText
                        text={displayName}
                        onChangeText={t => this.setState({ displayName: t })}
                        placeholder="Enter your shop name"
                        placeholderColor={colors.grey3}
                        isTextEditable={editing}
                        style={styles.displayName}
                      />
                      <NBButton
                        transparent
                        bordered
                        small
                        full
                        style={styles.editOrFollowButton}
                        onPress={() => this.setState({ editing: !editing })}>
                        <Text style={styles.editOrFollowButtonText}>
                          {editing ? 'Save' : 'Edit Profile'}
                        </Text>
                      </NBButton>
                    </View>
                  ) : (
                    <View style={styles.profileRight}>
                      {displayName !== '' && <Text>{displayName}</Text>}
                      <NBButton
                        transparent
                        bordered
                        small
                        full
                        style={styles.editOrFollowButton}
                        onPress={() => console.warn('f')}>
                        <Text style={styles.editOrFollowButtonText}>
                          {following ? 'Unfollow' : 'Follow'}
                        </Text>
                      </NBButton>
                    </View>
                  )}
                </View>
              </View>
              <View {...padder}>
                {this.isMe() ? (
                  <EditableText
                    text={bio}
                    onChangeText={t => this.setState({ bio: t })}
                    placeholder="Write your profile description"
                    placeholderColor={colors.grey3}
                    isTextEditable={editing}
                  />
                ) : (
                  bio !== '' && <Text>{bio}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
        <ImageGrid
          apiURL={`/api/products?userid=${_id}`}
          navigation={this.props.navigation}
        />
      </Container>
    );
  }
}

const padder = { padding: 10 };

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  username: {
    color: colors.grey1,
    marginVertical: 15,
  },
  icon: {
    color: colors.grey1,
    fontSize: 27,
  },
  avatarContainer: {
    height: 125,
    width: 125,
  },
  profileRight: {
    alignSelf: 'flex-start',
    flex: 1,
    paddingLeft: 10,
    width: '100%',
  },
  profileTop: {
    paddingLeft: 10,
    paddingTop: 10,
    backgroundColor: colors.white,
  },
  displayName: {
    color: colors.grey1,
    fontSize: 20,
    fontWeight: '400',
    // elipsis?
  },
  editOrFollowButton: {
    marginRight: 20,
    marginVertical: 10,
    backgroundColor: colors.bgDefault,
    borderColor: colors.greyOutline,
    borderRadius: 5,
  },
  editOrFollowButtonText: {
    color: colors.grey1,
  },
});

const mapStateToProps: any = (state: any) => ({
  userData: state.LoginReducer.data,
});

export const Profile = connect(mapStateToProps)(ProfileScreen);
