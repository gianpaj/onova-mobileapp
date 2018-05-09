// @flow
import React from 'react';
import { connect } from 'react-redux';

import {
  Dimensions,
  Image,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActionSheet,
  Body,
  Button as NBButton,
  Container,
  Content,
  Icon as NBIcon,
  Left,
  Right,
  Title,
} from 'native-base';
import { NavigationActions } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { Button } from 'react-native-elements';
import { NoticeBar, Toast } from 'antd-mobile';
// import StarRating from 'react-native-star-rating';

import {
  Avatar,
  EditableText,
  Header,
  ImageGrid,
  NotificationsDot,
} from '../components';
import { getPersonalUserData } from '../actions/actionCreator';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { UserData, Dispatch, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  _id: string,
  bio: string,
  displayName: string,
  editing: boolean,
  followersCount: number,
  isFollowing: boolean,
  isSaving: boolean,
  isFetching: boolean,
  profilePic: string | Image,
  rateAvg: number,
  reviewsCount: number,
  username: string,
};

const defaultState = {
  _id: '',
  bio: '',
  displayName: '',
  editing: false,
  followersCount: -1,
  isFollowing: false,
  isSaving: false,
  isFetching: true,
  profilePic: '',
  rateAvg: -1,
  reviewsCount: -1,
  username: '',
};

// TODO: if Product is mine Delete, Edit
const BUTTONS = ['Report', 'Cancel'];

const { height } = Dimensions.get('window');

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
    if (params && params._id) {
      api
        .get(`/api/users/${params._id}`)
        .then((res: UserData) => {
          const {
            _id,
            bio,
            displayName,
            profilePic,
            username,
            followersCount,
            ratingsTotal,
            reviewsCount,
          } = res;
          this.setState({
            _id,
            bio,
            displayName,
            profilePic,
            username,
            followersCount,
            rateAvg:
              ratingsTotal == 0 ? ratingsTotal : ratingsTotal / reviewsCount,
            reviewsCount,
          });
        })
        .catch(err => {
          console.debug(err);
        });
      const { token } = this.props.userData;
      api
        .get(`/api/users/${params._id}/follow`, { token })
        .then(res => {
          const { following } = res.data;
          if (following == params._id) {
            this.setState({ isFollowing: true });
          }
        })
        .catch(err => {
          console.debug(err);
        })
        .then(() => this.setState({ isFetching: false }));
    } else {
      this.props
        .dispatch(getPersonalUserData(userData._id))
        .then(() => this.setState({ isFetching: false }));
    }
  }

  componentWillMount() {
    this.refresh();
  }

  componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;

    const {
      _id,
      bio,
      displayName,
      profilePic,
      username,
      followersCount,
      ratingsTotal,
      reviewsCount,
    } = nextProps.userData;

    this.setState({
      _id,
      username,
      followersCount,
      rateAvg: ratingsTotal == 0 ? ratingsTotal : ratingsTotal / reviewsCount,
      reviewsCount,
      isFetching: false,
    });

    if (this.hasStateDifferedFromProps(nextProps.userData, 'bio')) {
      this.setState({ bio });
    }

    if (this.hasStateDifferedFromProps(nextProps.userData, 'displayName')) {
      this.setState({ displayName });
    }

    if (this.hasStateDifferedFromProps(nextProps.userData, 'profilePic')) {
      this.setState({ profilePic });
    }
  }

  hasStateDifferedFromProps(nextProps: any, key: string): boolean {
    return nextProps[key] && !Object.is(nextProps[key], this.props[key]);
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
      key: 'settings',
    });
    this.props.navigation.dispatch(navigateToSettings);
    // reset state
    this.setState(defaultState);
  };

  onSave = () => {
    this.setState({ isSaving: true });
    const { userData } = this.props;
    const { bio, displayName, profilePic } = this.state;
    const formData = new FormData();

    if (bio && bio !== '') {
      formData.append('bio', bio);
    }

    if (displayName && displayName !== '') {
      formData.append('displayName', displayName);
    }

    if (profilePic && profilePic.path !== undefined) {
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
        token: userData.token,
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
        this.setState({ isSaving: false });
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
        if (buttonIndex == BUTTONS.indexOf('Report')) {
          // report action
        } else {
          console.debug('Cancel');
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
    this.props.navigation.navigate('notifications');
  };

  shouldComponentUpdate(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) {
      return false;
    }
    return true;
  }

  shouldShowNoticeBar() {
    return this.props.userData.accountStatus == 'notverified';
  }

  goToReviews() {
    this.props.navigation.navigate('reviews', { userId: this.state._id });
  }

  goToFollowing() {
    this.props.navigation.navigate('followers', { userId: this.state._id });
  }

  renderUserNumbers = () => {
    return (
      <View style={styles.userNumbers}>
        <TouchableOpacity
          onPress={() => this.goToReviews()}
          style={styles.alignCenter}>
          <Text style={styles.numbers}>{this.state.reviewsCount}</Text>
          <Text>reviews</Text>
          {/* <StarRating
            // eslint-disable-next-line
            buttonStyle={{ paddingHorizontal: 0 }}
            // eslint-disable-next-line
            containerStyle={{ alignSelf: 'center' }}
            disabled
            emptyStar={
              Platform.OS == 'ios' ? 'ios-star-outline' : 'md-star-outline'
            }
            emptyStarColor={colors.yellow}
            fullStar={Platform.OS == 'ios' ? 'ios-star' : 'md-star'}
            fullStarColor={colors.yellow}
            iconSet="Ionicons"
            rating={this.state.rateAvg}
            starSize={25}
          /> */}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.goToFollowing()}
          style={styles.alignCenter}>
          <Text style={styles.numbers}>{this.state.followersCount}</Text>
          <Text>followers</Text>
        </TouchableOpacity>
      </View>
    );
  };

  onFollowOrUnfollow() {
    const { token } = this.props.userData;
    const followOrUnfollow = !this.state.isFollowing ? 'follow' : 'unfollow';
    api
      .post(`/api/users/${this.state._id}/${followOrUnfollow}`, {}, { token })
      .then(() => {
        this.setState({ isFollowing: followOrUnfollow == 'follow' });
      })
      .catch(err => {
        console.error(err);
      });
  }

  renderProfileTop() {
    const {
      bio,
      displayName,
      editing,
      profilePic,
      isFollowing,
      isSaving,
      username,
    } = this.state;
    return (
      <View style={styles.profileTop}>
        <View>
          <View style={[styles.row, { marginTop: 20 }]}>
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
                    placeholder="Edit your shop name"
                    placeholderColor={colors.grey3}
                    isTextEditable={editing}
                    style={styles.displayName}
                    shouldAutoFocus
                    loading={isSaving}
                  />
                  {this.renderUserNumbers()}
                  <NBButton
                    transparent
                    bordered
                    small
                    full
                    style={
                      editing
                        ? [styles.editOrFollowButton, styles.saveButton]
                        : styles.editOrFollowButton
                    }
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
                  {displayName !== '' && (
                    <Text style={{ color: colors.black }}>{displayName}</Text>
                  )}
                  {this.renderUserNumbers()}
                  <NBButton
                    transparent
                    bordered={isFollowing}
                    small
                    full
                    style={[
                      styles.editOrFollowButton,
                      !isFollowing && { backgroundColor: colors.active },
                    ]}
                    onPress={() => this.onFollowOrUnfollow()}>
                    <Text
                      style={[
                        styles.editOrFollowButtonText,
                        !isFollowing && { color: colors.white },
                      ]}>
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Text>
                  </NBButton>
                </View>
              )}
            </View>
          </View>
          <View style={{ paddingVertical: 30, paddingHorizontal: 10 }}>
            {this.isMe() ? (
              <EditableText
                style={{ fontSize: 15 }}
                autoCorrect
                text={bio}
                onChangeText={t => this.setState({ bio: t })}
                placeholder="Edit your profile description"
                placeholderColor={colors.grey3}
                isTextEditable={editing}
              />
            ) : (
              bio !== '' && (
                <Text style={{ color: colors.black, fontSize: 15 }}>{bio}</Text>
              )
            )}
          </View>
        </View>
      </View>
    );
  }

  render() {
    const { _id, username, isFetching } = this.state;

    const { navigation } = this.props;

    if (isFetching) return null;

    return (
      <Container>
        <Header style={{ backgroundColor: colors.bgDefault }}>
          <Left style={styles.container}>
            {this.ifNavigatedFromProduct() ? (
              <NBButton transparent dark onPress={() => navigation.goBack()}>
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
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>@{username}</Title>
          </Body>
          <Right>
            {this.ifNavigatedFromProduct() ? (
              <NBButton transparent dark onPress={this.showActionSheet}>
                <NBIcon ios="ios-more" android="md-more" />
              </NBButton>
            ) : (
              <NBButton transparent onPress={this.onGoToSettings}>
                <NBIcon
                  ios="ios-settings"
                  android="md-settings"
                  style={styles.icon}
                />
              </NBButton>
            )}
          </Right>
        </Header>
        <Content style={{ backgroundColor: colors.bgDefault }}>
          <View>
            {this.shouldShowNoticeBar() && (
              <NoticeBar
                marqueeProps={{ loop: false, style: styles.noticeBar }}
                icon={false}>
                Please verify you email to start buying or selling.
              </NoticeBar>
            )}
            {this.renderProfileTop()}
          </View>
          {_id !== '' && (
            <ImageGrid
              apiURL={`/api/products?userid=${_id}`}
              navigation={navigation}
              emptyState={
                <View style={styles.emptyContainer}>
                  {this.isMe() ? (
                    <View>
                      <Text>You did not add any items yet</Text>
                      <Button
                        raised
                        rounded
                        backgroundColor={colors.black}
                        containerViewStyle={styles.searchButton}
                        onPress={() => navigation.navigate('addOrEditProduct')}
                        title="Sell something now"
                      />
                    </View>
                  ) : (
                    <Text>There no any items yet</Text>
                  )}
                </View>
              }
            />
          )}
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  alignCenter: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  icon: {
    color: colors.grey1,
    fontSize: 27,
  },
  avatarContainer: {
    marginTop: 4,
    height: 115,
    width: 115,
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
  userNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  numbers: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
  saveButton: {
    borderColor: colors.primary,
  },
  noticeBar: {
    color: colors.grey2,
    textAlign: 'center',
    width: '34.5%',
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    height: height - 250,
    justifyContent: 'center',
    padding: 20,
  },
  searchButton: {
    backgroundColor: colors.transparent,
    marginTop: 20,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Profile = connect(mapStateToProps)(ProfileScreen);
