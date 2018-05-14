// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  // Animated,
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
// import LottieView from 'lottie-react-native';

import { Avatar, Header, MediaView, Comments } from '../components';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import typography from '../config/typography';

import type { MapStateToProps } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import type { Product as ProductType, UserData, ReduxState } from '../types';

type Props = {
  navigation: NavigationScreenProp<*>,
  product: ProductType,
  URL: string,
  userData: UserData,
};

type State = {
  loading: boolean,
  loadingBuy: boolean,
  item: ?ProductType,
  // likeAnimValue: number,
};

// const isIOS = Platform.OS === 'ios';

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

  componentWillMount() {
    this.refresh();

    this.props.navigation.addListener('didFocus', () => {
      setTimeout(() => {
        this.refresh();
      }, 1000);
    });
  }

  showActionSheetForProduct = () => {
    let BUTTONS;
    // if (this.isMyProduct()) {
    BUTTONS = ['Delete', 'Edit', 'Cancel'];
    // } else {
    //   BUTTONS = ['Report', 'Cancel'];
    // }

    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: 0,
        cancelButtonIndex: BUTTONS.indexOf('Cancel'),
      },
      buttonIndex => {
        switch (buttonIndex) {
          // case BUTTONS.indexOf('Report'):
          //   alert('report me like those french girls 🎨');
          //   // report action
          //   break;
          case BUTTONS.indexOf('Edit'):
            this.props.navigation.navigate('addOrEditProduct', {
              item: this.state.item,
            });
            break;
          case BUTTONS.indexOf('Delete'):
            ui.showConfirmAlert('Confirm deletion?', '', () => {
              this.deleteItem();
            });
            // report action
            break;
          // case BUTTONS.indexOf('Share'):
          //   this.showShareActionSheet();
          //   break;
          default:
            console.debug('Cancel');
            break;
        }
      }
    );
  };

  deleteItem() {
    const { uuid } = this.props.navigation.state.params;
    const { token } = this.props.userData;
    api
      .del(`/api/products/${uuid}`, { token })
      .then(() => {
        this.props.navigation.goBack();
      })
      .catch(e => console.error(e));
  }

  /* showShareActionSheet() {
    Share.share({
      title: 'cool',
      url: 'https://onova.co', // ios only
    }).then(res => {
      console.log(res);
      if (isIOS) {
        if (res.action == Share.dismissedAction) {
          console.log('iOS: user cancelled sharing');
        } else if (res.action == Share.sharedAction) {
          console.log('iOS: user shared on:', res.activityType);
        }
      } else {
        // android
        console.log("Android: we don't know if user shared item");
      }
    });
  }*/

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

    const { _id } = this.props.userData;
    let routeName = 'profileInStack';
    if (_id == user._id) {
      routeName = 'profile';
    }
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
  };

  isUserVerified(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      api
        .get(`/api/users/${this.props.userData._id}`)
        .then((res: UserData) => {
          console.debug(res);
          if (res.accountStatus == 'verified') {
            return resolve(true);
          }
          resolve(false);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  onPressBuy = () => {
    const { item } = this.state;
    if (this.state.loadingBuy || !item) return;

    // check if product is still `forsale`
    this.setState({ loadingBuy: true });

    this.isUserVerified()
      .then(isVerified => {
        if (!isVerified) {
          throw Error('You need to validate your account...');
        }
      })
      .then(() => api.getProduct(item.uuid))
      .then((product: ProductType) => {
        // TODO: if product status is 'reserved' say you can try again later...
        if (product.status !== 'forsale') {
          throw Error('This product is not longer for sale');
        } else {
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
        }
      })
      .catch(err => {
        // TODO: show toast with err
        ui.showToast(err.message, 'warning', 'ok');
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
      key: 'searchProductsResults',
      params: {
        tag: matchingString.replace('#', ''),
        grp_1: -1,
        grp_2: -1,
      },
    });
  };

  render() {
    const { item, loading } = this.state;

    // join array of tags and add the `#` char for rendering
    let tags;
    if (item && item.tags)
      tags = item.tags
        .map(tag => `#${tag}`)
        .join(' ')
        .toString();

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
            {this.isMyProduct() && (
              <NBButton
                transparent
                dark
                onPress={this.showActionSheetForProduct}>
                <NBIcon ios="ios-more" android="md-more" />
              </NBButton>
            )}
          </Right>
        </Header>
        <Content
          ref={r => {
            this.scrollView = r;
          }}
          style={styles.container}>
          {loading && <ActivityIndicator size="large" />}
          {item && (
            <View>
              <View style={styles.topSection}>
                <View style={[styles.avatar, styles.row]}>
                  <Avatar
                    size={'verySmall'}
                    uri={item.seller.profilePic}
                    onPress={this.goToProfileOfSeller}
                    placeholderText={item.seller.username}
                  />
                  <View style={{ marginLeft: 10, alignSelf: 'center' }}>
                    <TouchableOpacity onPress={this.goToProfileOfSeller}>
                      <Text style={styles.username}>
                        {item.seller.username}
                      </Text>
                    </TouchableOpacity>
                    {item.location && (
                      <Text style={styles.location}>{item.location}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.flex1} />
                <Text style={styles.price}>
                  {item.price} {item.currency}
                </Text>
              </View>
              <MediaView source={item.photoURIs} />
              {!this.isMyProduct() && (
                <View
                  style={[
                    styles.padder,
                    styles.bottomSection,
                    // negative margin for the carousel dots
                    item.photoURIs.length > 1 && { marginTop: -35 },
                  ]}>
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
                  {/* <NBIcon
                  name="ios-share-outline"
                  style={styles.iconCommmentAndShare}
                  onPress={() => this.showShareActionSheet()}
                /> */}

                  <View style={styles.flex1} />
                  <Button
                    // disabled
                    style={{ fontWeight: 9 }}
                    buttonStyle={styles.buyButton}
                    onPress={() => this.onPressBuy()}
                    title="Chat"
                    loading={this.state.loadingBuy}
                  />
                </View>
              )}
              {/* <View style={styles.bottomSectionAfter}>
                <Text style={styles.timeAgo}>{'X MINUTES AGO'}</Text>
              </View> */}
              <View
                style={[
                  styles.bottomSectionAfter,
                  // negative margin for the carousel dots
                  this.isMyProduct() &&
                    item.photoURIs.length > 1 && { marginTop: 15 },
                ]}>
                <Text style={styles.description}>{item.description}</Text>
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
                scrollView={this.scrollView}
                goToProfile={this.goToProfile}
              />
            </View>
          )}
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    fontWeight: 'bold',
  },
  location: {
    // height: 20,
    // lineHeight: 20,
    // flex: 1,
  },
  price: {
    alignSelf: 'center',
    color: colors.black,
    fontSize: 16,
    marginRight: 15,
  },
  bottomSection: {
    height: 54,
    flexDirection: 'row',
    marginRight: 0,
  },
  // iconSave: {
  //   marginTop: 12,
  // },
  // iconCommmentAndShare: {
  //   // marginLeft: 20,
  //   marginTop: 12,
  // },
  buyButton: {
    backgroundColor: colors.red,
    borderRadius: 5,
    marginTop: 9,
    paddingBottom: 8,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  bottomSectionAfter: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
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
  userData: state.LoginReducer.data,
});

export const Product = connect(mapStateToProps)(ProductContainer);
