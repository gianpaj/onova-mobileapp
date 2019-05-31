// @flow

import React from 'react';
import { connect } from 'react-redux';
import { ActivityIndicator, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActionSheet, Body, Button as NBButton, Container, Content, Icon as NBIcon, Left, Right } from 'native-base';
import { Button } from 'react-native-elements';
import ParsedText from 'react-native-parsed-text';
import { Modal } from 'antd-mobile-rn';
import axios from 'axios';
import Analytics from 'react-native-analytics-segment-io';
import { NavigationActions } from 'react-navigation';
import { URL } from 'react-native-dotenv';
// import LottieView from 'lottie-react-native';

import { Avatar, Header, MediaView, Comments } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import typography from '../config/typography';
import { enableRefresh } from '../actions/actionCreator';

import type { MapStateToProps } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, Product as ProductType, UserData, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  shouldRefresh: boolean,
  skippedLogin: boolean,
  token: string,
  userData: UserData,
};

type State = {
  item: ?ProductType,
  loading: boolean,
  loadingBuy: boolean,
  // likeAnimValue: number,
};

const { analyticsEnabled } = api;

export class ProductContainer extends React.Component<Props, State> {
  anim: ?React$Element<*>;
  cancelToken;
  didFocusListener;
  scrollView: Content;
  reqTimer = 0;

  constructor(props: Props) {
    super(props);
    this.scrollView = React.createRef();
  }

  state = {
    item: null,
    loading: false,
    loadingBuy: false,
    // likeAnimValue: new Animated.Value(0.35),
  };

  componentDidMount() {
    this.reqTimer = setTimeout(() => {
      this.setState({ loading: true });
    }, 1000);

    this.refresh().then(() => {
      if (this.reqTimer) {
        clearTimeout(this.reqTimer);
      }
      this.setState({ loading: false });
    });

    this.didFocusListener = this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        setTimeout(() => {
          this.refresh();
        }, 1000);
      }
    });
  }

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken.cancel('operation_canceled');
    this.didFocusListener.remove();
    if (this.reqTimer) clearTimeout(this.reqTimer);
  }

  showActionSheetForProduct = () => {
    const { skippedLogin } = this.props;
    const DELETE = I18n.t('alerts.action_button_delete');
    const EDIT = I18n.t('alerts.action_button_edit');
    const CANCEL = I18n.t('alerts.action_button_cancel');
    const REPORT = I18n.t('alerts.action_button_report');
    const SHARE = I18n.t('alerts.action_button_share');

    let BUTTONS = [REPORT, SHARE, CANCEL];
    let BUTTONSArr = [REPORT, SHARE, CANCEL];

    if (Platform.OS === 'android') {
      BUTTONS = [
        {
          icon: 'md-warning',
          iconColor: 'red',
          text: REPORT,
        },
        {
          icon: 'md-share',
          text: SHARE,
        },
        {
          icon: 'close',
          text: CANCEL,
        },
      ];
    }
    if (skippedLogin) {
      // remove Report options
      BUTTONS.splice(0, 1);
      BUTTONSArr.splice(0, 1);
    } else if (this.isMyProduct()) {
      BUTTONS = [DELETE, EDIT, SHARE, CANCEL];
      BUTTONSArr = [DELETE, EDIT, SHARE, CANCEL];
      if (Platform.OS === 'android') {
        BUTTONS = [
          {
            icon: 'md-trash',
            iconColor: 'red',
            text: DELETE,
          },
          {
            icon: 'md-create',
            text: EDIT,
          },
          {
            icon: 'md-share',
            text: SHARE,
          },
          {
            icon: 'md-close',
            text: CANCEL,
          },
        ];
      }
    }

    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: 0,
        cancelButtonIndex: BUTTONSArr.indexOf(CANCEL),
      },
      buttonIndex => {
        switch (buttonIndex) {
          case BUTTONSArr.indexOf(REPORT):
            Modal.prompt(
              I18n.t('product.alert_report_title'),
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
            break;
          case BUTTONSArr.indexOf(EDIT):
            this.props.navigation.navigate('addOrEditProduct', {
              item: this.state.item,
            });
            break;
          case BUTTONSArr.indexOf(DELETE):
            ui.showConfirmAlert(I18n.t('product.alert_confirm_delete'), '', () => {
              this.deleteItem();
            });
            break;
          case BUTTONSArr.indexOf(SHARE):
            this.shareProduct();
            break;
          default:
            console.debug(CANCEL);
            break;
        }
      }
    );
  };

  shareProduct = () => {
    const { item } = this.state;
    const url = `https://${URL}/${item.seller.username}/${item.uuid}`;
    let promise;
    if (Platform.OS === 'ios') {
      promise = Share.share({ url: url });
    } else {
      promise = Share.share({ message: url });
    }
    promise.then(res => {
      if (this.props.skippedLogin) return;
      // ios user shared it
      // android probably user shared it
      if ((Platform.OS === 'ios' && res.action !== Share.dismissedAction) || Platform.OS !== 'ios') {
        return this.onSuccessfulShare();
      }
      throw new Error('not_shared');
    });
    if (analyticsEnabled) Analytics.track('press_share_product');
  };

  onMandatoryShare(): Promise<null | Error> {
    return Share.share({
      message: I18n.t('product.share'),
      title: 'Share',
    }).then(res => {
      // ios user shared it
      // android probably user shared it
      if ((Platform.OS === 'ios' && res.action !== Share.dismissedAction) || Platform.OS !== 'ios') {
        return this.onSuccessfulShare();
      }
      throw new Error('not_shared');
    });
  }

  onSuccessfulShare = (): Promise<any> => {
    const { userData, token } = this.props;
    return api.put(`/api/users/${userData._id}`, { increaseShare: true }, { token });
  };

  onReport = async (text: string) => {
    const { token } = this.props;
    if (text.length < settings.MIN_LENGTH_REPORT) {
      ui.showToast(I18n.t('alerts.report_error'), 'warning', 'OK');
      return;
    }

    try {
      await api.post(
        '/api/report',
        {
          product: this.state.item.uuid,
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

  deleteItem() {
    const { uuid } = this.props.navigation.state.params;
    const { token } = this.props;
    api
      .del(`/api/products/${uuid}`, { token })
      .then(() => {
        this.props.dispatch(enableRefresh());
        this.props.navigation.goBack();
      })
      .catch(e => console.error(e));
  }

  refresh(): Promise<any> {
    const { params }: { params: ProductType } = this.props.navigation.state;
    let uuid;

    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();

    // for development
    if (!params) {
      // local
      // uuid = 'SJewilLU8z';
      // prod
      uuid = 'SBLQo57m6';
    } else {
      uuid = params.uuid;
    }
    console.debug('product uuid:', uuid);
    return api
      .getProduct(uuid, { cancelToken: this.cancelToken.token })
      .then(data => {
        if (data.status !== 'forsale' && data.status !== 'reserved') {
          return this.props.navigation.goBack();
        }
        this.setState({ item: data });
        return data;
      })
      .catch(e => console.error(e));
  }

  goToProfileOfSeller = () => {
    if (this.state.item) {
      // $FlowFixMe
      this.goToProfile(this.state.item.seller);
    }
  };

  goToProfile = (user: UserData) => {
    if (!user._id) return;

    const navigateToProfile = NavigationActions.push({
      routeName: 'profileInStack',
      params: user,
      key: `profile-${user.username}`,
    });

    if (this.props.navigation) this.props.navigation.dispatch(navigateToProfile);
  };

  hasUserShared(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      api
        .get(`/api/users/${this.props.userData._id}`)
        .then((res: UserData) => {
          console.debug(res);
          if (res.sharedCount > 0) {
            return resolve(true);
          }
          resolve(false);
        })
        .catch(err => reject(err));
    });
  }

  onPressReserved = async () => {
    const { status } = await this.refresh();
    if (status === 'reserved') {
      ui.showToast(I18n.t('product.reserved_message'), 'warning', I18n.t('product.toast_warning_ok_button'));
    }
  };

  onPressBuy = () => {
    const { item, loadingBuy } = this.state;
    if (loadingBuy || !item) return;

    if (this.props.skippedLogin) this.props.dispatch(openLoginModal());

    // check if product is still `forsale`
    this.setState({ loadingBuy: true });

    this.hasUserShared()
      .then(async hasShared => {
        if (!hasShared) {
          await new Promise((resolve, reject) => {
            ui.showConfirmAlert(
              I18n.t('product.share_before'),
              '',
              async () => {
                try {
                  await this.onMandatoryShare();
                  resolve();
                } catch (err) {
                  reject(err);
                }
              },
              () => this.setState({ loadingBuy: false }),
              I18n.t('alerts.confirm_alert_button_cancel'),
              I18n.t('product.toast_warning_ok_button')
            );
          });
        }
      })
      .then(() => api.getProduct(item.uuid))
      .then((product: ProductType) => {
        // TODO: if the product is reserved to me open the checkout (e.g. if closed the app and want to finish paying) - not visible at the moment
        // if product status is not longer for sale while looking at an item (ie. a second person presses buy faster)
        if (product.status !== 'forsale') {
          // this.refresh();
          if (product.status === 'reserved') {
            throw Error(I18n.t('product.reserved_message'));
          }
          throw Error(I18n.t('product.toast_warning_on_product_sold'));
        }
        if (analyticsEnabled) Analytics.track('press_buy', { uuid: product.uuid });

        // this.props.navigation.navigate({
        //   routeName: 'chat',
        //   params: {
        //     productUuid: product.uuid,
        //     roomId: -1,
        //     userId: product.seller.id,
        //   },
        // });
        this.props.navigation.navigate({
          routeName: 'checkout',
          params: product,
          key: `checkout-${product.uuid}`,
        });
      })
      .catch(err => {
        if (err.message === 'not_shared') err.message = I18n.t('product.share_before');
        ui.showToast(err.message, 'warning', I18n.t('product.toast_warning_ok_button'));
        console.log(err);
      })
      .then(() => {
        setTimeout(() => {
          this.setState({ loadingBuy: false });
        }, 700);
      });
  };

  isMyProduct(): boolean | null {
    const { userData, skippedLogin } = this.props;
    if (!this.state.item || skippedLogin) return null;
    return this.state.item.seller._id == userData._id;
  }

  // onPressLike = () => {
  //   Animated.timing(this.state.likeAnimValue, {
  //     toValue: 0.7,
  //     duration: 800,
  //   }).start();
  // };

  handleHashtagPress = (matchingString: string) => {
    this.props.navigation.navigate({
      routeName: 'searchProductsResults',
      key: `searchProductsResults-${matchingString}`,
      params: {
        tag: matchingString.replace('#', ''),
        grp_1: -1,
        grp_2: -1,
      },
    });
  };

  render() {
    const { item, loading, loadingBuy } = this.state;
    const { navigation, skippedLogin, userData, token } = this.props;

    // join array of tags and add the `#` char for rendering
    let tags;
    if (item && item.tags)
      tags = item.tags
        .map(tag => `#${tag}`)
        .join(' ')
        .toString();

    const thereIsACarousel = item && item.photoURIs.length > 1;

    return (
      <Container>
        <Header>
          <Left>
            <NBButton transparent dark onPress={() => navigation.goBack()}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body />
          <Right>
            <NBButton transparent dark onPress={this.showActionSheetForProduct}>
              <NBIcon ios="ios-more" android="md-more" />
            </NBButton>
          </Right>
        </Header>
        {loading && (
          <View style={styles.spinnerStyle}>
            <ActivityIndicator size="large" />
          </View>
        )}
        <Content ref={this.scrollView} style={styles.flex1}>
          {item && (
            <>
              <View style={styles.topSection}>
                <View style={[styles.avatar, styles.row]}>
                  <Avatar
                    size={'verySmall'}
                    uri={item.seller.profilePic || ''}
                    onPress={this.goToProfileOfSeller}
                    placeholderText={item.seller.username}
                  />
                  <View style={{ marginLeft: 10, alignSelf: 'center' }}>
                    <TouchableOpacity onPress={this.goToProfileOfSeller}>
                      <Text style={styles.username}>{item.seller.username}</Text>
                    </TouchableOpacity>
                    {item.locality ? <Text style={styles.location}>{item.locality}</Text> : null}
                  </View>
                </View>
                <View style={styles.flex1} />
                <Text style={styles.price}>{`${ui.formatCurrency(item.price, 0)} ${I18n.t(item.currency)}`}</Text>
              </View>
              <MediaView source={item.photoURIs} />
              <View
                style={[
                  styles.marginVertical,
                  styles.padder,
                  // negative margin for the carousel dots
                  thereIsACarousel && { marginTop: -28 },
                ]}>
                <NBButton transparent dark onPress={this.shareProduct} style={styles.shareIconButton}>
                  <NBIcon ios="ios-share" android="md-share" style={styles.shareIcon} />
                </NBButton>
                {!this.isMyProduct() && (
                  <View style={[styles.bottomSection, { marginTop: -40 }]}>
                    {/* <NBIcon name="ios-bookmark-outline" style={styles.iconSave} /> */}
                    {/* <TouchableOpacity
                    onPress={() => this.onPressLike()}
                    underlayColor="transparent"
                    // disabled={this.state.midAnimation}>
                    <LottieView
                      ref={c => {
                        this.anim = c;
                      }}
                      // $FlowFixMe
                      source={require('../assets/animations/favorite_black.json')}
                      progress={this.state.likeAnimValue}
                    />
                  </TouchableOpacity> */}
                    {/* <NBIcon
                    name="ios-text-outline"
                    style={styles.iconCommmentAndShare}
                  /> */}
                    <View style={styles.flex1} />
                    {item.status === 'forsale' && (
                      <Button
                        buttonStyle={styles.buyButton}
                        containerViewStyle={styles.buyButtonContainer}
                        onPress={this.onPressBuy}
                        textStyle={{
                          fontWeight: 'bold',
                          paddingHorizontal: 10,
                        }}
                        title={I18n.t('product.buy_button')}
                        loading={loadingBuy}
                      />
                    )}
                    {item.status === 'reserved' && (
                      <Button
                        buttonStyle={styles.reservedButton}
                        containerViewStyle={styles.buyButtonContainer}
                        onPress={this.onPressReserved}
                        rightIcon={{
                          name: 'timer-sand',
                          type: 'material-community',
                        }}
                        textStyle={{ paddingLeft: 10 }}
                        title={I18n.t('product.reserved_button')}
                      />
                    )}
                  </View>
                )}
                {/* <View style={styles.bottomSectionAfter}>
                  <Text style={styles.timeAgo}>{'X MINUTES AGO'}</Text>
                </View> */}
                <View
                  style={[
                    styles.marginVertical,
                    // negative margin for the carousel dots
                    thereIsACarousel && { marginTop: 15 },
                  ]}>
                  <Text style={[styles.description, item.tags && { marginBottom: 10 }]}>{item.description}</Text>
                  {item.tags && (
                    <ParsedText
                      parse={[
                        {
                          pattern: /#(\S+)/,
                          style: styles.hashtag,
                          onPress: this.handleHashtagPress,
                        },
                      ]}
                      childrenProps={{ allowFontScaling: false }}>
                      {tags}
                    </ParsedText>
                  )}
                </View>
                {!skippedLogin && (
                  <Comments
                    uuid={item.uuid}
                    userData={userData}
                    token={token}
                    scrollView={this.scrollView}
                    goToProfile={this.goToProfile}
                  />
                )}
              </View>
            </>
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
  topSection: {
    height: 50,
    flexDirection: 'row',
    marginLeft: 15,
  },
  spinnerStyle: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  avatar: {
    alignSelf: 'center',
  },
  username: {
    color: colors.black,
  },
  location: {
    marginTop: -2,
  },
  price: {
    alignSelf: 'center',
    color: colors.black,
    fontSize: 16,
    marginRight: 15,
  },
  // iconSave: {
  //   marginTop: 12,
  // },
  // iconCommmentAndShare: {
  //   // marginLeft: 20,
  //   marginTop: 12,
  // },
  shareIconButton: {
    paddingBottom: Platform.select({
      ios: 5,
      android: 0,
    }),
    marginLeft: -10,
    paddingHorizontal: 10,
    zIndex: 999,
  },
  shareIcon: {
    color: colors.grey1,
    fontSize: 27,
    marginRight: 0,
    marginLeft: 0,
  },
  buyButton: {
    backgroundColor: colors.red,
    borderRadius: 2,
    paddingVertical: 8,
  },
  reservedButton: {
    backgroundColor: colors.secondary,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  buyButtonContainer: {
    marginRight: 0,
    marginLeft: 0,
  },
  bottomSection: {
    height: 54,
    flexDirection: 'row',
    marginRight: 0,
  },
  marginVertical: {
    marginTop: 10,
    marginBottom: 20,
  },
  padder: {
    paddingHorizontal: 10,
  },
  description: {
    fontSize: typography.font_body_size,
    color: colors.black,
  },
  row: {
    flexDirection: 'row',
  },
  // timeAgo: {
  //   color: colors.grey3,
  //   fontSize: 12,
  // },
  hashtag: {
    color: colors.active,
  },
});

const mapStateToProps: MapStateToProps<*, *, *> = (state: ReduxState) => ({
  shouldRefresh: state.RefresherReducer.shouldRefresh,
  skippedLogin: state.LoginReducer.skippedLogin,
  token: state.LoginReducer.token,
});

export const Product = connect(mapStateToProps)(ProductContainer);
