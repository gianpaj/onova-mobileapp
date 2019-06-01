// @flow
import React from 'react';
import { connect } from 'react-redux';

import { Dimensions, Image, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActionSheet, Body, Button as NBButton, Container, Icon as NBIcon, Left, Right } from 'native-base';
import { NavigationActions } from 'react-navigation';
import { TabView, TabBar } from 'react-native-tab-view';
import { URL } from 'react-native-dotenv';
import { Modal, NoticeBar, Toast } from 'antd-mobile-rn';
import Analytics from 'react-native-analytics-segment-io';

import type { NavigationScreenProp } from 'react-navigation';

import { Avatar, EditableText, Header, NotificationsDot, Title } from '../components';
import ShopTab from './ShopTab';
import UserDropsTab from './UserDropsTab';
import { getPersonalUserData, enableRefresh } from '../actions/actionCreator';

import I18n from '../i18n';
import typography from '../config/typography';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { UserData, Dispatch, ReduxState } from '../types';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  dispatch: Dispatch,
  imageGrid: any,
  navigation: NavigationScreenProp<*>,
  skippedLogin: boolean,
  token: string,
  userData: UserData,
};

type State = {
  _id: string,
  bio: string,
  displayName: string,
  editing: boolean,
  followersCount: number,
  followingCount: number,
  index: number,
  isFetching: boolean,
  isFollowing: boolean,
  isRefreshing: boolean,
  isSaving: boolean,
  ordersAndReviewsCount: number,
  profilePic: string | Image,
  // rateAvg: number,
  routes: Array<any>,
  username: string,
  // suggestions: Array<any>,
};

const { analyticsEnabled } = api;

class ProfileScreen extends React.Component<Props, State> {
  state = {
    _id: '',
    bio: '',
    displayName: '',
    editing: false,
    followersCount: -1,
    followingCount: -1,
    index: 0,
    isFetching: true,
    isFollowing: false,
    isRefreshing: false,
    isSaving: false,
    ordersAndReviewsCount: -1,
    profilePic: '',
    // rateAvg: -1,
    username: '',
    // suggestions: [],
    routes: [{ key: 'shop', title: I18n.t('profile.shop_tab') }, { key: 'drops', title: I18n.t('profile.drops_tab') }],
  };

  static navigationOptions = () => ({
    tabBarIcon: (props: any) => <NotificationsDot {...props} />,
  });

  refresh = async (): Promise<any> => {
    const { userData, token, navigation, skippedLogin } = this.props;
    const { params } = navigation.state;

    // const CancelToken = axios.CancelToken;
    // this.cancelToken = CancelToken.source();
    try {
      let userId;
      // if the screen was navigated with an userID
      if (params && params._id) {
        userId = params._id;
      } else {
        userId = userData._id;
      }
      const res: UserData = await api.get(`/api/users/${userId}`);
      const {
        _id,
        bio,
        displayName,
        followersCount,
        followingCount,
        ordersAndReviewsCount,
        profilePic,
        username,
      } = res;

      this.setState({
        _id,
        bio,
        displayName,
        followersCount,
        followingCount,
        ordersAndReviewsCount,
        profilePic,
        username,
      });

      // if it's not me
      if (params && userData && params._id !== userData._id) {
        const { data } = await api.get(`/api/users/${userId}/follow`, { token });
        if (data.following == params._id) {
          this.setState({ isFollowing: true });
        }
        return;
      }
      // const suggestions = await api.getSuggestions(token);

      // this.setState({ suggestions });
      if (!skippedLogin) this.props.dispatch(getPersonalUserData());
    } catch (err) {
      if (err.message == 'Not following') return;
      throw err;
    }
  };

  componentDidMount() {
    const { navigation, skippedLogin } = this.props;
    if (navigation.state.params && navigation.state.params.tab == 'drops') {
      this.setState({ index: 1 });
    }

    if (skippedLogin && !navigation.state.params) {
      this.props = {
        ...this.props,
        userData: {
          // onova user
          _id: '5afb40d0741c953ef07a616f',
          accountStatus: 'verified',
        },
      };
    }

    this.refresh()
      .then(() => this.setState({ isFetching: false }))
      .catch(e => console.error(e));
  }

  onGoToSettings = () => {
    if (!this.hasUnsavedChanges()) {
      this.setState({ editing: false });
      return this.goToSettings();
    }
    ui.showConfirmAlert(
      I18n.t('profile.alert_unsaved_changes_title'),
      I18n.t('profile.alert_unsaved_changes_body'),
      () => {
        // on continue
        this.refresh();
        this.setState({ editing: false });
        this.goToSettings();
      },
      () => {},
      I18n.t('profile.alert_unsaved_changes_button_cancel'),
      I18n.t('profile.alert_unsaved_changes_button_confirm')
    );
  };

  goToSettings = () => {
    const navigateToSettings = NavigationActions.navigate({
      routeName: 'settings',
      key: 'settings',
    });
    this.props.navigation.dispatch(navigateToSettings);
  };

  onSave = () => {
    this.setState({ isSaving: true });
    const { userData, token } = this.props;
    const { bio, displayName, profilePic } = this.state;
    const formData = new FormData();

    formData.append('bio', bio);

    formData.append('displayName', displayName);

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
        return this.refresh();
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

  /**
   * return true if it has changes that need to be saved
   */
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
        switch (buttonIndex) {
          case BUTTONS.indexOf(REPORT):
            Modal.prompt(
              I18n.t('profile.alert_report_title'),
              I18n.t('alerts.report_subtitle'),
              [
                { text: CANCEL },
                {
                  text: REPORT,
                  onPress: this.onReport,
                },
              ],
              'default',
              ''
            );
            break;
          case BUTTONS.indexOf(BLOCK):
            ui.showConfirmAlert(I18n.t('profile.alert_block_title'), I18n.t('profile.alert_block_subtitle'), () =>
              this.onBlock()
            );
            break;

          default:
            console.debug('Cancelled reporting');
            break;
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
      await api.post('/api/block', { targetUser: this.state._id }, { token });
      this.props.dispatch(enableRefresh());
      ui.showToast(I18n.t('profile.alert_block_success'), '', 'OK');
      this.props.navigation.goBack();
    } catch (err) {
      console.error(err);
      ui.showToast(err.message, 'error', 'OK');
    }
  };

  isMe(): boolean {
    const { userData, navigation, skippedLogin } = this.props;
    const { params } = navigation.state;
    if (skippedLogin) return false;
    if (!params) return true;

    return params._id == userData._id;
  }

  // or from push notification
  ifNavigatedFromProduct = () => (this.props.navigation.state.params ? true : false);

  openNotifications = () =>
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'notifications',
      key: `notifications`,
    });

  shouldShowNoticeBar() {
    return this.isMe() && this.props.userData.accountStatus == 'notverified';
  }

  goToReviews = () => {
    const { navigation, skippedLogin } = this.props;
    if (skippedLogin) return navigation.navigate('inAppAuth');
    const { _id } = this.state;
    // $FlowFixMe
    navigation.navigate({
      routeName: 'reviews',
      params: { userId: _id },
      key: `reviews-${_id}`,
    });
  };

  goToFollowers = () => {
    const { navigation, skippedLogin } = this.props;
    if (skippedLogin) return navigation.navigate('inAppAuth');
    const { _id } = this.state;
    // $FlowFixMe
    navigation.navigate({
      routeName: 'followers',
      params: { userId: _id },
      key: `followers-${_id}`,
    });
  };

  goToFollowing = () => {
    const { navigation, skippedLogin } = this.props;
    if (skippedLogin) return navigation.navigate('inAppAuth');
    const { _id } = this.state;
    // $FlowFixMe
    navigation.navigate({
      routeName: 'following',
      params: { userId: _id },
      key: `following-${_id}`,
    });
  };

  // goToSuggestions = () =>
  //   this.props.navigation.navigate({
  //     routeName: 'suggestions',
  //     key: 'suggestions',
  //   });

  renderUserNumbers = () => {
    const { ordersAndReviewsCount, followersCount, followingCount } = this.state;

    return (
      <View style={styles.userNumbers}>
        <TouchableOpacity onPress={this.goToReviews} style={styles.alignCenter}>
          <Text style={styles.numbers}>{ordersAndReviewsCount}</Text>
          <Text style={styles.label}>{I18n.t('profile.reviews_label')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.goToFollowers} style={styles.alignCenter}>
          <Text style={styles.numbers}>{followersCount}</Text>
          <Text style={styles.label}>{I18n.t('profile.followers_label')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.goToFollowing} style={styles.alignCenter}>
          <Text style={styles.numbers}>{followingCount}</Text>
          <Text style={styles.label}>{I18n.t('profile.following_label')}</Text>
        </TouchableOpacity>
        {/* {this.isMe() && (
          <TouchableOpacity onPress={this.goToSuggestions} style={styles.alignCenter}>
            <Text style={[styles.numbers, suggestions.new && suggestions.data.length ? { color: colors.red } : {}]}>
              {suggestions.data.length}
            </Text>
            <Text style={styles.label}>{I18n.t('profile.suggestions_label')}</Text>
          </TouchableOpacity>
        )} */}
      </View>
    );
  };

  onFollowOrUnfollow = () => {
    const { token, skippedLogin } = this.props;

    if (skippedLogin) return this.props.navigation.navigate('inAppAuth');

    const followOrUnfollow = !this.state.isFollowing ? 'follow' : 'unfollow';
    api
      .post(`/api/users/${this.state._id}/${followOrUnfollow}`, {}, { token })
      .then(() => this.setState({ isFollowing: followOrUnfollow == 'follow' }))
      .catch(err => console.debug(err));
  };

  renderProfileTop() {
    const { bio, displayName, editing, profilePic, isFollowing, isSaving, username } = this.state;
    return (
      <View style={styles.profileTop}>
        <>
          <View style={[styles.row, { marginTop: 5 }]}>
            <Avatar
              style={styles.avatarContainer}
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
                    style={editing ? [styles.editOrFollowButton, styles.saveButton] : styles.editOrFollowButton}
                    onPress={() => {
                      editing ? this.onSave() : this.setState({ editing: !editing });
                    }}>
                    <Text style={[styles.editOrFollowButtonText, editing && { color: colors.white }]}>
                      {editing ? I18n.t('profile.save_profile_button') : I18n.t('profile.edit_profile_button')}
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
                    style={[styles.editOrFollowButton, !isFollowing && { backgroundColor: colors.active }]}
                    onPress={this.onFollowOrUnfollow}>
                    <Text style={[styles.editOrFollowButtonText, !isFollowing && { color: colors.white }]}>
                      {isFollowing ? I18n.t('profile.unfollow_button') : I18n.t('profile.follow_button')}
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
        </>
      </View>
    );
  }

  shareProfile = async () => {
    const { username } = this.state;

    const url = `https://${URL}/${username}`;
    if (Platform.OS === 'ios') {
      await Share.share({ url });
    } else {
      await Share.share({ message: url });
    }
    if (analyticsEnabled) Analytics.track('press_share_profile');
  };

  _renderTabBar = props => (
    <TabBar
      {...props}
      // scrollEnabled
      indicatorStyle={styles.indicator}
      style={styles.tabbar}
      labelStyle={styles.tabBarlabel}
    />
  );

  _renderScene = ({ route }) => {
    switch (route.key) {
      case 'shop':
        if (this.state._id)
          return (
            <ShopTab
              refreshProfile={this.refresh}
              userid={this.state._id}
              navigation={this.props.navigation}
              header={this.renderHeader()}
            />
          );
        break;
      case 'drops':
        if (this.state.username)
          return (
            <UserDropsTab
              username={this.state.username}
              navigation={this.props.navigation}
              header={this.renderHeader()}
            />
          );
        break;
      default:
        return null;
    }
    return null;
  };

  _handleIndexChange = index => this.setState({ index });

  renderHeader = () => {
    return (
      <>
        <View>
          {this.shouldShowNoticeBar() && (
            <NoticeBar marqueeProps={{ loop: false, style: styles.noticeBar }} icon={false}>
              {I18n.t('alerts.notice_bar_account_verification')}
            </NoticeBar>
          )}
          {this.renderProfileTop()}
        </View>
      </>
    );
  };

  render() {
    const { username, isFetching } = this.state;
    const { navigation, userData, skippedLogin } = this.props;

    if (isFetching || (!userData && !skippedLogin)) return null;

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            {this.ifNavigatedFromProduct() ? (
              <NBButton transparent dark onPress={() => navigation.goBack()}>
                <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
              </NBButton>
            ) : (
              <NBButton
                style={skippedLogin && { opacity: 0.2 }}
                disabled={skippedLogin}
                transparent
                dark
                onPress={this.openNotifications}>
                <NBIcon ios="ios-notifications" android="md-notifications" style={styles.icon} />
              </NBButton>
            )}
          </Left>
          <Body style={styles.flex2AndCenter}>
            {/* eslint-disable-next-line react-native/no-raw-text */}
            <Title>@{username}</Title>
          </Body>
          <Right>
            <NBButton transparent dark onPress={this.shareProfile}>
              <NBIcon ios="ios-share" android="md-share" style={styles.icon} />
            </NBButton>
            {!this.ifNavigatedFromProduct() && this.isMe() && (
              <NBButton transparent onPress={this.onGoToSettings}>
                <NBIcon ios="ios-settings" android="md-settings" style={styles.icon} />
              </NBButton>
            )}
            {!this.isMe() && (
              <NBButton
                style={skippedLogin && { opacity: 0.2 }}
                disabled={skippedLogin}
                transparent
                dark
                onPress={this.showReportUserActionSheet}>
                <NBIcon ios="ios-more" android="md-more" style={styles.icon} />
              </NBButton>
            )}
          </Right>
        </Header>
        <TabView
          testID="Tabs"
          navigationState={this.state}
          renderScene={this._renderScene}
          renderTabBar={this._renderTabBar}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
          lazy
        />
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  alignCenter: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 4,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  editOrFollowButton: {
    backgroundColor: colors.bgDefault,
    borderColor: colors.greyOutline,
    borderRadius: 5,
    marginVertical: 10,
  },
  editOrFollowButtonText: {
    color: colors.grey1,
  },
  flex1: {
    flex: 1,
  },
  flex2AndCenter: {
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  icon: {
    color: colors.grey1,
    fontSize: 27,
  },
  indicator: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.grey2,
    fontSize: Platform.select({
      ios: 13,
      android: 14,
    }),
  },
  noticeBar: {
    color: colors.grey2,
    textAlign: 'center',
    width: '34.5%',
  },
  numbers: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileRight: {
    alignSelf: 'flex-start',
    flex: 1,
    paddingLeft: 10,
    width: '100%',
  },
  profileTop: {
    backgroundColor: colors.bgDefault,
    // elevation: 0.5, // android
    paddingHorizontal: 10,
    paddingTop: 10,
    // shadowColor: colors.black,
    // shadowOffset: { height: 0.5 },
    // shadowOpacity: 0.1,
    // shadowRadius: 0.5,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: colors.active,
  },
  tabBarlabel: {
    color: colors.black,
    fontWeight: '400',
  },
  tabbar: {
    backgroundColor: colors.bgDefault,
    elevation: 2,
  },
  userNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  skippedLogin: state.LoginReducer.skippedLogin,
  token: state.LoginReducer.token,
  userData: state.LoginReducer.data,
});

export const Profile = connect(mapStateToProps)(ProfileScreen);
