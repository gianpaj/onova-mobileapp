// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  // Animated,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {
  ActionSheet,
  Body,
  Button as NBButton,
  Container,
  Content,
  Header,
  Icon as NBIcon,
  Left,
  Right,
} from 'native-base';
import { Button } from 'react-native-elements';
// import LottieView from 'lottie-react-native';

import { Avatar, MediaView, Comments } from '../components';

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

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
  addCommentError: boolean,
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
    addCommentError: false,
    loading: true,
    loadingBuy: false,
    // likeAnimValue: new Animated.Value(0.35),
    item: null,
  };

  showActionSheetForProduct = () => {
    let BUTTONS;
    if (this.isMyProduct()) {
      BUTTONS = ['Delete', 'Cancel'];
    } else {
      BUTTONS = ['Report', 'Cancel'];
    }

    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: 0,
        cancelButtonIndex: BUTTONS.indexOf('Cancel'),
      },
      buttonIndex => {
        switch (buttonIndex) {
          case BUTTONS.indexOf('Report'):
            alert('report me like those french girls 🎨');
            // report action
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

  // showShareActionSheet() {
  //   Share.share({
  //     title: 'cool',
  //     url: 'https://onova.co', // ios only
  //   }).then(res => {
  //     console.log(res);
  //     if (isIOS) {
  //       if (res.action == Share.dismissedAction) {
  //         console.log('iOS: user cancelled sharing');
  //       } else if (res.action == Share.sharedAction) {
  //         console.log('iOS: user shared on:', res.activityType);
  //       }
  //     } else {
  //       // android
  //       console.log("Android: we don't know if user shared item");
  //     }
  //   });
  // }

  componentWillMount() {
    const { params }: { params: ProductType } = this.props.navigation.state;
    let uuid;

    // for development
    if (!params) {
      uuid = 'SJWwox8LLG';
    } else {
      uuid = params.uuid;
    }
    console.debug('product uuid:', uuid);
    this._getProduct(uuid)
      .then(data => {
        this.setState({
          item: data,
          loading: false,
        });
      })
      .catch(e => {
        console.error(e);
      });
  }

  _getProduct(uuid: string): Promise<ProductType> {
    return new Promise((resolve, reject) => {
      api
        .get(`/api/products/${uuid}`)
        .then(({ data }) => resolve(data))
        .catch(e => reject(e));
    });
  }

  goToProfileOfSeller = () => {
    if (this.state.item) {
      // $FlowFixMe
      this.goToProfile(this.state.item.seller);
    }
  };

  goToProfile(user: UserData) {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'profile',
      params: user,
      key: `profile-${user.username}`,
    });
  }

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
      .then(() => this._getProduct(item.uuid))
      .then((product: ProductType) => {
        // @TODO: if product status is 'reserved' say you can try again later...
        if (product.status !== 'forsale') {
          throw Error('This product is not longer for sale');
        } else {
          // $FlowFixMe
          this.props.navigation.navigate({
            routeName: 'checkout',
            params: item,
            key: `checkout-${product.uuid}`,
          });
        }
      })
      .catch(err => {
        // @TODO: show toast with err
        console.warn(err.message);
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

  render() {
    const { item, loading } = this.state;

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
          style={styles.container}>
          {loading && <ActivityIndicator size="large" />}
          {item && (
            <View>
              <View style={styles.topSection}>
                <View style={styles.avatar}>
                  <View style={styles.row}>
                    <TouchableHighlight onPress={this.goToProfileOfSeller}>
                      <Avatar
                        size={'verySmall'}
                        // $FlowFixMe
                        uri={item.seller.profilePic}
                        onPress={this.goToProfileOfSeller}
                        placeholderText={
                          // $FlowFixMe
                          item.seller.displayName
                            ? item.seller.displayName
                            : item.seller.username
                        }
                      />
                    </TouchableHighlight>
                    <View style={{ marginLeft: 10, alignSelf: 'center' }}>
                      <TouchableHighlight onPress={this.goToProfileOfSeller}>
                        <Text style={styles.username}>
                          {item.seller.username}
                        </Text>
                      </TouchableHighlight>
                      {/* // $FlowFixMe */}
                      {item.location && (
                        <Text style={styles.location}>{item.location}</Text>
                      )}
                    </View>
                  </View>
                  {/* // $FlowFixMe */}
                </View>
                <View style={styles.flex} />
                <Text style={styles.price}>
                  {/* // $FlowFixMe */}
                  {item.price} {item.currency}
                </Text>
              </View>
              {/* // $FlowFixMe */}
              <MediaView source={item.photoURIs} />
              <View style={[styles.padder, styles.bottomSection]}>
                {/* <NBIcon name="ios-bookmark-outline" style={styles.iconSave} /> */}
                {/* <TouchableOpacity
                  onPress={() => this.onPressLike()}
                  underlayColor="transparent"
                  // disabled={this.state.midAnimation}
                  style={styles.likeButton}>
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

                <View style={styles.flex} />
                {!this.isMyProduct() && (
                  <Button
                    // disabled
                    // loading
                    buttonStyle={styles.buyButton}
                    onPress={() => this.onPressBuy()}
                    title="Buy"
                    loading={this.state.loadingBuy}
                  />
                )}
              </View>
              {/* <View style={styles.bottomSectionAfter}>
                <Text style={styles.timeAgo}>{'X MINUTES AGO'}</Text>
              </View> */}
              <View style={[styles.padder, styles.bottomSectionAfter]}>
                {/* // $FlowFixMe */}
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <Comments
                uuid={item.uuid}
                userData={this.props.userData}
                scrollView={this.scrollView}
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
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  topSection: {
    backgroundColor: colors.white,
    height: 60,
    flexDirection: 'row',
    marginLeft: 15,
  },
  avatar: {
    flex: 1,
    height: 35,
    marginTop: 12,
  },
  username: {
    fontWeight: 'bold',
  },
  location: {
    // height: 20,
    // lineHeight: 20,
    // flex: 1,
  },
  price: {
    lineHeight: 44,
    marginRight: 15,
    alignSelf: 'center',
  },
  bottomSection: {
    height: 54,
    backgroundColor: colors.white,
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
  // likeButton: {
  //   height: 150,
  //   margin: -47,
  //   marginLeft: -65,
  //   width: 150,
  // },
  buyButton: {
    backgroundColor: colors.grey1,
    marginTop: 9,
    paddingBottom: 8,
    paddingRight: 12,
    paddingTop: 8,
  },
  bottomSectionAfter: {
    marginTop: 9,
    marginBottom: 20,
    // marginLeft: 15,
  },
  padder: {
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
  },
  // timeAgo: {
  //   color: colors.grey3,
  //   fontSize: 12,
  // },
});

const mapStateToProps: MapStateToProps<*, *, *> = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Product = connect(mapStateToProps)(ProductContainer);
