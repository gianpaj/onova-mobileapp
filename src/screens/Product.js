// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  TouchableOpacity,
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
// $FlowFixMe
import LottieView from 'lottie-react-native';
import { NavigationActions } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';

import { MediaView } from '../components';

import colors from '../config/colors';
import * as api from '../utils/api';
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
  item: ProductType,
  likeAnimValue: number,
};

// @TODO: if Product is mine Delete, Edit
const BUTTONS = ['Report', 'Cancel'];

// const isIOS = Platform.OS === 'ios';

export class ProductContainer extends React.Component<Props, State> {
  anim: ?React$Element<*>;

  state = {
    loading: true,
    loadingBuy: false,
    likeAnimValue: new Animated.Value(0.35),
    item: {},
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
            console.debug('Cancel');
            break;
        }
      }
    );
  };

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
    const { params } = this.props.navigation.state;
    let uuid;

    // for development
    if (!params) {
      uuid = 'SJewilLU8z';
    } else {
      uuid = params.uuid;
      console.debug(params);
    }

    this._getProduct(uuid)
      .then(data => {
        console.log(data);
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
        .then(res => resolve(res.data))
        .catch(e => reject(e));
    });
  }

  goToProfile = () => {
    if (this.state.item) {
      const user = this.state.item.seller;

      const navigateToProfile = NavigationActions.navigate({
        routeName: 'profile',
        params: user,
      });

      this.props.navigation.dispatch(navigateToProfile);
    }
  };

  isProductForSale(product: ProductType): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._getProduct(product.uuid)
        .then(data => {
          if (!data) return reject();
          if (data.status == 'forsale') {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(e => reject(e));
    });
  }

  isUserVerified(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      api
        .get(`/api/users/${this.props.userData._id}`)
        .then((res: UserData) => {
          console.debug(res);
          if (res.accountStatus == 'verified') {
            resolve(true);
          } else if (res.accountStatus !== 'verified') {
            resolve(false);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  onPressBuy = () => {
    if (this.state.loadingBuy) return;

    // check if product is still `forsale`
    this.setState({ loadingBuy: true });

    if (this.state.item) {
      this.isUserVerified()
        .then(isVerified => {
          if (!isVerified) {
            throw Error('You need to validate your account...');
          }
        })
        .then(() => {
          return this.isProductForSale(this.state.item).then(isForSale => {
            // @TODO: check product status. if 'reserved' say you can try again later...
            if (!isForSale) {
              throw Error('The product is not longer for sale');
            } else {
              const navigateToCheckout = NavigationActions.navigate({
                routeName: 'checkout',
                // $FlowFixMe
                params: this.state.item,
              });
              this.props.navigation.dispatch(navigateToCheckout);
            }
          });
        })
        .catch(err => {
          // @TODO: show toast with err
          console.warn(err.message);
        })
        .then(() => {
          this.setState({ loadingBuy: false });
        });
    }

    // const navigateToOrderThread = NavigationActions.navigate({
    //   routeName: 'orderThread',
    //   params: this.state.item,
    // });

    // this.props.navigation.dispatch(navigateToOrderThread);
  };

  isMyProduct(): boolean | null {
    if (!this.state.item) return null;
    return this.state.item.seller._id == this.props.userData._id;
  }

  onPressLike = () => {
    Animated.timing(this.state.likeAnimValue, {
      toValue: 0.7,
      duration: 800,
    }).start();
  };

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
            <NBButton transparent dark onPress={this.showActionSheet}>
              <NBIcon ios="ios-more" android="md-more" />
            </NBButton>
          </Right>
        </Header>
        <Content style={styles.container}>
          {loading && <ActivityIndicator size="large" />}
          {Object.keys(item).length !== 0 && (
            <View>
              <View style={styles.topSection}>
                {/* <Image
                  style={styles.avatar}
                  source={{ uri: item.avatarUrl }}
                /> */}
                <View style={styles.avatar}>
                  <TouchableHighlight
                    style={styles.flex}
                    onPress={this.goToProfile}>
                    <Text style={styles.username}>{item.seller.username}</Text>
                  </TouchableHighlight>
                  <Text style={styles.location}>{item.location}</Text>
                </View>
                <View style={styles.flex} />
                <Text style={styles.price}>{item.price}</Text>
              </View>
              <MediaView source={item.photoURIs} />
              <View style={styles.bottomSection}>
                {/* <NBIcon name="ios-bookmark-outline" style={styles.iconSave} /> */}
                <TouchableOpacity
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
                </TouchableOpacity>
                <NBIcon
                  name="ios-text-outline"
                  style={styles.iconCommmentAndShare}
                />
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
              <View style={styles.bottomSectionAfter}>
                <Text style={styles.description}>{item.description}</Text>
              </View>
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
    flex: 1,
  },
  price: {
    lineHeight: 60,
    marginRight: 15,
  },
  bottomSection: {
    height: 54,
    backgroundColor: colors.white,
    flexDirection: 'row',
    marginLeft: 15,
    marginRight: 0,
  },
  // iconSave: {
  //   marginTop: 12,
  // },
  iconCommmentAndShare: {
    // marginLeft: 20,
    marginTop: 12,
  },
  likeButton: {
    height: 150,
    margin: -47,
    marginLeft: -65,
    width: 150,
  },
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
    marginLeft: 15,
  },
  // timeAgo: {
  //   color: colors.grey3,
  //   fontSize: 12,
  // },
});

import type { MapStateToProps } from 'react-redux';

const mapStateToProps: MapStateToProps<*, *, *> = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Product = connect(mapStateToProps)(ProductContainer);
