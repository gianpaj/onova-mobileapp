// @flow
import React from 'react';
import { connect } from 'react-redux';

import {
  Dimensions,
  Image,
  RefreshControl,
  StyleSheet,
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
// import { Button } from 'react-native-elements';
import { Modal, NoticeBar, Toast } from 'antd-mobile';

import I18n from '../i18n';
import typography from '../config/typography';

import {
  Avatar,
  EditableText,
  Header,
  ImageGrid,
  NotificationsDot,
} from '../components';
import { getPersonalUserData, enableRefresh } from '../actions/actionCreator';

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { UserData, Dispatch, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  imageGrid: any,
  token: string,
};

type State = {
  _id: string,
  bio: string,
  displayName: string,
  editing: boolean,
  followersCount: number,
  followingCount: number,
  isFollowing: boolean,
  isSaving: boolean,
  isFetching: boolean,
  isRefreshing: boolean,
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
  followingCount: -1,
  isFollowing: false,
  isRefreshing: false,
  isSaving: false,
  isFetching: true,
  profilePic: '',
  rateAvg: -1,
  reviewsCount: -1,
  username: '',
};

const { height } = Dimensions.get('window');

class ProfileScreen extends React.Component<Props, State> {
  state = { ...defaultState };
  imageGrid: any;

  constructor(props) {
    super(props);
    this.imageGrid = React.createRef();
  }

  static navigationOptions = () => ({
    tabBarIcon: (props: any) => <NotificationsDot {...props} />,
  });

  refresh = (): Promise<any> => {
    const { params } = this.props.navigation.state;
    const { userData } = this.props;

    // const CancelToken = axios.CancelToken;
    // this.cancelToken = CancelToken.source();

    return new Promise((resolve, reject) => {
      // if the screen navigated with an userID and it's not me
      if (params && params._id && userData._id !== params._id) {
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
              followingCount,
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
              followingCount,
              rateAvg:
                ratingsTotal == 0 ? ratingsTotal : ratingsTotal / reviewsCount,
              reviewsCount,
            });
          })
          .catch(err => {
            reject(err);
            console.debug(err);
          });
        const { token } = this.props;
        api
          .get(`/api/users/${params._id}/follow`, { token })
          .then(res => {
            const { following } = res.data;
            if (following == params._id) {
              this.setState({ isFollowing: true });
            }
            resolve();
          })
          .catch(err => {
            console.debug(err);
            if (err.message == 'Not following') {
              return resolve();
            }
            reject(err);
          });
      } else {
        this.props
          .dispatch(getPersonalUserData(userData._id))
          .then(() => resolve());
      }
    });
  };

  onRefresh = () => {
    this.setState({ isRefreshing: true });

    let Promises = [];
    Promises.push(this.refresh());
    if (this.imageGrid && this.imageGrid.getWrappedInstance)
      Promises.push(this.imageGrid.getWrappedInstance().fetchItems());
    Promise.all(Promises).then(() => this.setState({ isRefreshing: false }));
  };

  componentDidMount() {
    this.refresh().then(() => this.setState({ isFetching: false }));
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) return;

    const {
      _id,
      bio,
      displayName,
      profilePic,
      username,
      followersCount,
      followingCount,
      ratingsTotal,
      reviewsCount,
    } = nextProps.userData;

    this.setState({
      _id,
      username,
      followersCount,
      followingCount,
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
        I18n.t('profile.alert_unsaved_changes_title'),
        I18n.t('profile.alert_unsaved_changes_body'),
        () => {
          // on continue
          this.goToSettings();
        },
        () => {},
        I18n.t('profile.alert_unsaved_changes_button_cancel'),
        I18n.t('profile.alert_unsaved_changes_button_confirm')
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
    const { userData, token } = this.props;
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

    Toast.loading(I18n.t('profile.toast_saving'), 30);

    api
      .put(`/api/users/${userData._id}`, formData, {
        suppressRedBox: true,
        timeout: 30000,
        token,
      })
      .then(res => {
        this.setState({ editing: false });
        console.debug(res);
        ui.showToast(I18n.t('profile.toast_updated'), 'success');
        this.refresh();
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

  showReportUserActionSheet = () => {
    const REPORT = I18n.t('alerts.action_button_report');
    const BLOCK = I18n.t('alerts.action_button_block');
    const CANCEL = I18n.t('alerts.action_button_cancel');

    const BUTTONS = [REPORT, BLOCK, CANCEL];

    ActionSheet.show(
      {
        options: BUTTONS,
        // destructiveButtonIndex: BUTTONS.indexOf(REPORT),
        cancelButtonIndex: BUTTONS.indexOf(CANCEL),
      },
      buttonIndex => {
        if (buttonIndex == BUTTONS.indexOf(REPORT)) {
          Modal.prompt(
            I18n.t('profile.alert_report_title'),
            I18n.t('alerts.report_subtitle'),
            [
              { text: CANCEL },
              {
                text: REPORT,
                onPress: t => this.onReport(t),
              },
            ],
            'default',
            ''
          );
        } else if (buttonIndex == BUTTONS.indexOf(BLOCK)) {
          ui.showConfirmAlert(
            I18n.t('profile.alert_block_title'),
            I18n.t('profile.alert_block_subtitle'),
            () => this.onBlock()
          );
        } else {
          console.debug('Cancel');
        }
      }
    );
  };

  onReport = async text => {
    const { token } = this.props;
    if (text.length < settings.MIN_LENGTH_REPORT) {
      ui.showToast(I18n.t('alerts.report_error'), 'warning', 'OK');
      return;
    }
    try {
      await api.post(
        '/api/report',
        {
          user: this.state._id,
          text,
        },
        { token }
      );
      ui.showToast(I18n.t('alerts.report_success'), '', 'OK');
      this.props.navigation.goBack();
    } catch (err) {
      console.error(err);
      ui.showToast(err.message, 'error', 'OK');
    }
  };

  onBlock = async () => {
    const { token } = this.props;
    try {
      await api.post(
        '/api/block',
        {
          targetUser: this.state._id,
        },
        { token }
      );
      this.props.dispatch(enableRefresh());
      ui.showToast(I18n.t('profile.alert_block_success'), '', 'OK');
      this.props.navigation.goBack();
    } catch (err) {
      console.error(err);
      ui.showToast(err.message, 'error', 'OK');
    }
  };

  isMe(): boolean {
    const navState = this.props.navigation.state;
    if (!navState.params) {
      return true;
    }

    return navState.params._id == this.props.userData._id;
  }

  ifNavigatedFromProduct = () =>
    this.props.navigation.state.params ? true : false;

  openNotifications = () =>
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'notifications',
      key: `notifications`,
    });

  shouldShowNoticeBar() {
    return this.props.userData.accountStatus == 'notverified';
  }

  goToReviews = () => {
    const { _id } = this.state;
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'reviews',
      params: { userId: _id },
      key: `reviews-${_id}`,
    });
  };

  goToFollowers = () => {
    const { _id } = this.state;
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'followers',
      params: { userId: _id },
      key: `followers-${_id}`,
    });
  };

  goToFollowing = () => {
    const { _id } = this.state;
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'following',
      params: { userId: _id },
      key: `following-${_id}`,
    });
  };

  renderUserNumbers = () => {
    return (
      <View style={styles.userNumbers}>
        <TouchableOpacity onPress={this.goToReviews} style={styles.alignCenter}>
          <Text style={styles.numbers}>{this.state.reviewsCount}</Text>
          <Text style={styles.label}>{I18n.t('profile.reviews_label')}</Text>
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
          onPress={this.goToFollowers}
          style={styles.alignCenter}>
          <Text style={styles.numbers}>{this.state.followersCount}</Text>
          <Text style={styles.label}>{I18n.t('profile.followers_label')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={this.goToFollowing}
          style={styles.alignCenter}>
          <Text style={styles.numbers}>{this.state.followingCount}</Text>
          <Text style={styles.label}>{I18n.t('profile.following_label')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  onFollowOrUnfollow() {
    const { token } = this.props;
    const followOrUnfollow = !this.state.isFollowing ? 'follow' : 'unfollow';
    api
      .post(`/api/users/${this.state._id}/${followOrUnfollow}`, {}, { token })
      .then(() => this.setState({ isFollowing: followOrUnfollow == 'follow' }))
      .catch(err => console.error(err));
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
          <View style={[styles.row, { marginTop: 5 }]}>
            <Avatar
              style={styles.avatarContainer}
              size={'default'}
              onChange={p => this.setState({ profilePic: p })}
              interactive={editing}
              uri={profilePic}
              placeholderText={username}
            />
            <View style={styles.flex1}>
              {this.isMe() ? (
                <View style={styles.profileRight}>
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
                    <Text
                      style={[
                        styles.editOrFollowButtonText,
                        editing && { color: colors.white },
                      ]}>
                      {editing
                        ? I18n.t('profile.save_profile_button')
                        : I18n.t('profile.edit_profile_button')}
                    </Text>
                  </NBButton>
                </View>
              ) : (
                <View style={styles.profileRight}>
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
                      {isFollowing
                        ? I18n.t('profile.unfollow_button')
                        : I18n.t('profile.follow_button')}
                    </Text>
                  </NBButton>
                </View>
              )}
            </View>
          </View>
          <View style={{ paddingVertical: 15, paddingHorizontal: 10 }}>
            <EditableText
              text={displayName}
              onChangeText={t => this.setState({ displayName: t })}
              placeholder={I18n.t('profile.display_name_placeholder')}
              placeholderColor={colors.primary}
              showPlaceholder={this.isMe()}
              isTextEditable={editing && this.isMe()}
              style={{
                fontSize: typography.font_body_size,
                color: colors.black,
                fontWeight: 'bold',
              }}
              shouldAutoFocus
              loading={isSaving}
            />
            <EditableText
              style={{
                fontSize: typography.font_body_size,
                color: colors.black,
              }}
              autoCorrect
              textInputProps={{ multiline: true, returnKeyType: 'default' }}
              text={bio}
              onChangeText={t => this.setState({ bio: t })}
              placeholder={I18n.t('profile.bio_placeholder')}
              placeholderColor={colors.primary}
              showPlaceholder={this.isMe()}
              isTextEditable={editing && this.isMe()}
            />
          </View>
        </View>
      </View>
    );
  }

  render() {
    const { _id, username, isFetching } = this.state;

    const { navigation, userData } = this.props;

    if (isFetching || !userData) return null;

    return (
      <Container>
        <Header>
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
            {!this.ifNavigatedFromProduct() &&
              this.isMe() && (
                <NBButton transparent onPress={this.onGoToSettings}>
                  <NBIcon
                    ios="ios-settings"
                    android="md-settings"
                    style={styles.icon}
                  />
                </NBButton>
              )}
            {!this.isMe() && (
              <NBButton
                transparent
                dark
                onPress={this.showReportUserActionSheet}>
                <NBIcon ios="ios-more" android="md-more" style={styles.icon} />
              </NBButton>
            )}
          </Right>
        </Header>
        <Content
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.onRefresh}
            />
          }>
          <View>
            {this.isMe() &&
              this.shouldShowNoticeBar() && (
                <NoticeBar
                  marqueeProps={{ loop: false, style: styles.noticeBar }}
                  icon={false}>
                  {I18n.t('profile.notice_bar')}
                </NoticeBar>
              )}
            {this.renderProfileTop()}
          </View>
          {_id !== '' && (
            <ImageGrid
              ref={i => (this.imageGrid = i)}
              apiURL={`/api/products?userid=${_id}`}
              navigation={navigation}
              emptyState={
                <View style={styles.emptyContainer}>
                  {this.isMe() ? (
                    <View>
                      <Text>{I18n.t('profile.empty_state_message_mine')}</Text>
                      <NBButton
                        block
                        dark
                        style={styles.searchButton}
                        onPress={() => navigation.navigate('addOrEditProduct')}>
                        <Text
                          // eslint-disable-next-line
                          style={{
                            fontSize: 16,
                            color: colors.white,
                          }}>
                          {I18n.t('profile.empty_state_button_mine')}
                        </Text>
                      </NBButton>
                    </View>
                  ) : (
                    <Text>{I18n.t('profile.empty_state_message_others')}</Text>
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
  label: {
    color: colors.grey2,
    fontSize: 14,
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
    backgroundColor: colors.active,
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
    marginTop: 20,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const Profile = connect(mapStateToProps)(ProfileScreen);
