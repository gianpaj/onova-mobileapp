// @flow
import React from 'react';
import { connect } from 'react-redux';

import {
  Image,
  StyleSheet,
  Text,
  View,
  // $FlowFixMe
} from 'react-native';
import {
  ActionSheet,
  Button as NBButton,
  Container,
  Header,
  Icon as NBIcon,
  Left,
  Right,
} from 'native-base';
import { NavigationActions } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { NoticeBar, Toast } from 'antd-mobile';

import {
  Avatar,
  EditableText,
  ImageGrid,
  NotificationsDot,
} from '../components';
import { getPersonalUserData, getUserData } from '../actions/actionCreator';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { UserData, Dispatch, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<any>,
  userData: UserData,
};

type State = {
  bio: string,
  displayName: string,
  editing: boolean,
  following: boolean,
  profilePic: string | Image,
};

const defaultState = {
  bio: '',
  displayName: '',
  editing: false,
  following: false,
  profilePic: '',
};

// @TODO: if Product is mine Delete, Edit
const BUTTONS = ['Report', 'Cancel'];

class ProfileScreen extends React.Component<Props, State> {
  state = { ...defaultState };

  static navigationOptions = () => ({
    tabBarIcon: (props: any) => <NotificationsDot {...props} />,
  });

  refresh() {
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

  componentWillMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;

    const { bio, displayName, profilePic } = nextProps.userData;

    if (this.hasStateDifferedFromProps(nextProps, 'bio')) {
      this.setState({ bio });
    }

    if (this.hasStateDifferedFromProps(nextProps, 'displayName')) {
      this.setState({ displayName });
    }

    if (this.hasStateDifferedFromProps(nextProps, 'profilePic')) {
      this.setState({ profilePic });
    }
  }

  hasStateDifferedFromProps(nextProps: any, key: string): boolean {
    return (
      nextProps.userData.displayName ||
      !Object.is(nextProps[key], this.props[key])
    );
  }

  onGoToSettings = () => {
    if (this.hasUnsavedChanges()) {
      ui.showConfirmAlert(
        'Unsaved Changes',
        'Are you sure you want to Cancel?',
        () => {
          // on continue
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
    // reset state
    this.setState(defaultState);
  };

  onSave = () => {
    const { userData } = this.props;
    const { bio, displayName, profilePic } = this.state;
    const formData = new FormData();

    if (bio && bio !== '') {
      formData.append('bio', bio);
    }

    if (displayName && displayName !== '') {
      formData.append('displayName', displayName);
    }

    if (profilePic && profilePic.path) {
      // $FlowFixMe
      formData.append('profilePic', {
        uri: profilePic.path,
        type: 'image/jpeg',
        name: 'image.jpg',
      });
    }

    Toast.loading('Loading...', 30);

    api
      .put(`/api/users/${userData._id}`, formData, {
        suppressRedBox: true,
        timeout: 30000,
      })
      .then(res => {
        this.setState({ editing: false });
        console.debug(res);
        ui.showToast('Your profile has been updated', 'success');
      })
      .catch(err => {
        console.debug(err);
        ui.showToast(err.message, 'danger');
      })
      // final
      .then(() => {
        Toast.hide();
      });
  };

  hasUnsavedChanges(): boolean {
    const { userData } = this.props;
    const { bio, displayName, profilePic } = this.state;

    return (
      (bio !== userData.bio && bio !== '') ||
      (displayName !== userData.displayName && displayName !== '') ||
      (profilePic !== userData.profilePic && profilePic !== '')
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

    return navState.params._id == this.props.userData._id;
  }

  ifNavigatedFromProduct = () => {
    const navState = this.props.navigation.state;
    return navState.params ? true : false;
  };

  openNotifications = () => {
    alert('code me like those french girls 🎨');
  };

  shouldComponentUpdate(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) {
      return false;
    } else {
      return true;
    }
  }

  shouldShowNoticeBar() {
    return this.props.userData.accountStatus == 'notverified';
  }

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
          {this.shouldShowNoticeBar && (
            <View>
              <NoticeBar
                style={{  }}
                marqueeProps={{ loop: false, style: styles.noticeBar }}
                icon={false}>
                Please verify you email to start buying or selling.
              </NoticeBar>
            </View>
          )}
          <View style={styles.profileTop}>
            <View>
              <View style={styles.row}>
                <Avatar
                  style={styles.avatarContainer}
                  size={'default'}
                  withBorder
                  onChange={p => this.setState({ profilePic: p })}
                  interactive={editing}
                  uri={profilePic}
                  placeholderText={username}
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
                        onPress={() => {
                          editing
                            ? this.onSave()
                            : this.setState({ editing: !editing });
                        }}>
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
  noticeBar: {
    color: colors.grey2,
    textAlign: 'center',
    width: '34.5%',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Profile = connect(mapStateToProps)(ProfileScreen);
