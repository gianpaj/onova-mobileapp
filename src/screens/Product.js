// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  // $FlowFixMe
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
import { NavigationActions } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';

import { MediaView } from '../components';

import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { Product as ProductType, UserData, ReduxState } from '../types';

type Props = {
  navigation: NavigationScreenProp<any>,
  product: ProductType,
  URL: string,
  userData: UserData,
};

type State = {
  loading: boolean,
  item: ProductType | null,
};

// @TODO: if Product is mine Delete, Edit
const BUTTONS = ['Report', 'Cancel'];

// const isIOS = Platform.OS === 'ios';

export class ProductContainer extends React.Component<Props, State> {
  state = {
    loading: true,
    item: null,
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

    console.debug(params);
    this._getProduct(params.uuid).then(() => {
      this.setState({ loading: false });
    });
  }

  _getProduct(uuid) {
    return api
      .get(`/api/products/${uuid}`)
      .then(res => {
        const data = res.data;
        console.log(res.data);
        this.setState({
          item: data,
        });
      })
      .catch(e => console.error(e));
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

  onPressBuy = () => {
    // @TODO: enable me
    // ui.showConfirmAlert(
    //   'Unsaved Changes',
    //   'Are you sure you want to Cancel?',
    //   () => {
    //   }
    // );
    // on continue
    const navigateToOrderThread = NavigationActions.navigate({
      routeName: 'orderThread',
      params: this.state.item,
    });

    this.props.navigation.dispatch(navigateToOrderThread);
  };

  isMyProduct(): boolean | null {
    if (!this.state.item) return null;
    return this.state.item.seller._id == this.props.userData._id;
  }

  render() {
    const { item, loading } = this.state;

    return (
      <Container>
        <Header>
          <Left>
            <NBButton
              transparent
              dark
              onPress={() =>
                this.props.navigation && this.props.navigation.goBack()
              }>
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
          {item && (
            <View>
              <View style={styles.topSection}>
                {/* <Image
                  style={styles.avatar}
                  source={{ uri: item.avatarUrl }}
                /> */}
                <View style={{ flex: 1, height: 35, marginTop: 12 }}>
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
  // avatar: {
  //   width: 36,
  //   height: 36,
  //   margin: 12,
  //   borderRadius: 18,
  //   borderWidth: StyleSheet.hairlineWidth,
  //   borderColor: colors.grey5,
  // },
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

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Product = connect(mapStateToProps)(ProductContainer);
