// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  // Animated,
  Platform,
  Share,
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
} from 'native-base';
import { Button } from 'react-native-elements';
import ParsedText from 'react-native-parsed-text';
import { Modal } from 'antd-mobile-rn';
import Analytics from 'react-native-analytics-segment-io';
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
import type {
  Dispatch,
  Product as ProductType,
  UserData,
  ReduxState,
} from '../types';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  shouldRefresh: boolean,
  token: string,
  userData: UserData,
};

type State = {
  loading: boolean,
  loadingBuy: boolean,
  item: ?ProductType,
  // likeAnimValue: number,
};

export class ProductContainer extends React.Component<Props, State> {
  anim: ?React$Element<*>;
  scrollView: Content;
  reqTimer = 0;

  state = {
    loading: true,
    loadingBuy: false,
    // likeAnimValue: new Animated.Value(0.35),
    item: null,
  };

  componentDidMount() {
    this.refresh();

    this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        setTimeout(() => {
          this.refresh();
        }, 1000);
      }
    });
  }

  showActionSheetForProduct = () => {
    const DELETE = I18n.t('alerts.action_button_delete');
    const EDIT = I18n.t('alerts.action_button_edit');
    const CANCEL = I18n.t('alerts.action_button_cancel');
    const REPORT = I18n.t('alerts.action_button_report');

    let BUTTONS = [REPORT, CANCEL];

    if (this.isMyProduct()) {
      BUTTONS = [DELETE, EDIT, CANCEL];
    }

    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: 0,
        cancelButtonIndex: BUTTONS.indexOf(CANCEL),
      },
      buttonIndex => {
        switch (buttonIndex) {
          case BUTTONS.indexOf(REPORT):
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
          case BUTTONS.indexOf(EDIT):
            this.props.navigation.navigate('addOrEditProduct', {
              item: this.state.item,
            });
            break;
          case BUTTONS.indexOf(DELETE):
            ui.showConfirmAlert(
              I18n.t('product.alert_confirm_delete'),
              '',
              () => {
                this.deleteItem();
              }
            );
            // report action
            break;
          // case BUTTONS.indexOf('Share'):
          //   this.showShareActionSheet();
          //   break;
          default:
            console.debug(CANCEL);
            break;
        }
      }
    );
  };

  shareProduct = () => {
    const { item } = this.state;
    if (Platform.OS === 'ios') {
      Share.share({
        url: `https://onova.co/${item.seller.username}/${item.uuid}`,
      });
    } else {
      Share.share({
        message: `https://onova.co/${item.seller.username}/${item.uuid}`,
      });
    }
    Analytics.track('press_share_product');
  };

  onMandatoryShare(): Promise<null | Error> {
    return Share.share({ message: I18n.t('home.share'), title: 'Share' })
      .then(async res => {
        // ios user shared it
        // android probably user shared it
        if (
          (Platform.OS === 'ios' && res.action !== Share.dismissedAction) ||
          Platform.OS !== 'ios'
        ) {
          await this.onSuccessfulShare();
          return null;
        } else {
          throw new Error('not_shared');
        }
      })
      .catch(e => {
        console.warn(e);
        return e;
      });
  }

  onSuccessfulShare = (): Promise<any> => {
    const { userData, token } = this.props;
    return new Promise(async (resolve, reject) => {
      try {
        const res = await api.put(
          `/api/users/${userData._id}`,
          {
            increaseShare: true,
          },
          { token }
        );
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
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

  refresh() {
    const { params }: { params: ProductType } = this.props.navigation.state;
    let uuid;

    // for development
    if (!params) {
      // local
      uuid = 'SJewilLU8z';
      // // prod
      // uuid = 'ry1yDIj6G';
    } else {
      uuid = params.uuid;
    }
    console.debug('product uuid:', uuid);
    api
      .getProduct(uuid)
      .then(data => {
        if (data.status !== 'forsale') {
          return this.props.navigation.goBack();
        }
        this.setState({
          item: data,
          loading: false,
        });
      })
      .catch(e => {
        console.error(e);
      });
  }

  goToProfileOfSeller = () => {
    if (this.state.item) {
      // $FlowFixMe
      this.goToProfile(this.state.item.seller);
    }
  };

  goToProfile = (user: UserData) => {
    if (!user._id) return;

    let routeName = 'profileInStack';
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
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

  onPressBuy = () => {
    const { item } = this.state;
    if (this.state.loadingBuy || !item) return;

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
        // TODO: if product status is 'reserved' say you can try again later...
        if (product.status !== 'forsale') {
          throw Error(I18n.t('product.toast_warning_on_product_sold'));
        }
        Analytics.track('press_buy', { uuid: product.uuid });

        // $FlowFixMe
        this.props.navigation.navigate({
          routeName: 'chat',
          params: {
            productUuid: product.uuid,
            roomId: -1,
            userId: product.seller.id,
          },
        });
        // this.props.navigation.navigate({
        //   routeName: 'checkout',
        //   params: item,
        //   key: `checkout-${product.uuid}`,
        // });
      })
      .catch(err => {
        if (err.message === 'not_shared')
          err.message = I18n.t('product.share_before');
        ui.showToast(
          err.message,
          'warning',
          I18n.t('product.toast_warning_ok_button')
        );
        console.log(err);
      })
      .then(() => {
        setTimeout(() => {
          this.setState({ loadingBuy: false });
        }, 700);
      });
  };

  isMyProduct(): boolean | null {
    if (!this.state.item) return null;
    return this.state.item.seller._id == this.props.userData._id;
  }

  // onPressLike = () => {
  //   Animated.timing(this.state.likeAnimValue, {
  //     toValue: 0.7,
  //     duration: 800,
  //   }).start();
  // };

  handleHashtagPress = (matchingString: string) => {
    // $FlowFixMe
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
            <NBButton
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
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
        <Content
          ref={r => {
            this.scrollView = r;
          }}
          style={styles.flex1}>
          {loading && <ActivityIndicator size="large" />}
          {item && (
            <View>
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
                      <Text style={styles.username}>
                        {item.seller.username}
                      </Text>
                    </TouchableOpacity>
                    {item.locality ? (
                      <Text style={styles.location}>{item.locality}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.flex1} />
                <Text style={styles.price}>
                  {item.price} {item.currency}
                </Text>
              </View>
              <MediaView source={item.photoURIs} />
              <View
                style={[
                  styles.marginVertical,
                  styles.padder,
                  // negative margin for the carousel dots
                  thereIsACarousel && { marginTop: -28 },
                ]}>
                <NBButton
                  transparent
                  dark
                  onPress={this.shareProduct}
                  style={styles.shareIconButton}>
                  <NBIcon
                    ios="ios-share"
                    android="md-share"
                    style={styles.shareIcon}
                  />
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
                    <Button
                      buttonStyle={styles.buyButton}
                      containerViewStyle={styles.buyButtonContainer}
                      onPress={this.onPressBuy}
                      textStyle={{ fontWeight: 'bold', paddingHorizontal: 10 }}
                      title={I18n.t('product.buy_button')}
                      loading={loadingBuy}
                    />
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
                  <Text
                    style={[
                      styles.description,
                      item.tags && { marginBottom: 10 },
                    ]}>
                    {item.description}
                  </Text>
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
                <Comments
                  uuid={item.uuid}
                  userData={this.props.userData}
                  token={this.props.token}
                  scrollView={this.scrollView}
                  goToProfile={this.goToProfile}
                />
              </View>
            </View>
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
  token: state.LoginReducer.token,
  userData: state.LoginReducer.data,
});

export const Product = connect(mapStateToProps)(ProductContainer);
