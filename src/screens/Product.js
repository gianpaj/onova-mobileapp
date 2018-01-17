// @flow

import React from 'react';
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
// prettier-ignore
import {
  Button,
} from 'react-native-elements';
// $FlowFixMe
import { NavigationActions, NavigationScreenProp } from 'react-navigation';

import { MediaView } from '../components';

import colors from '../config/colors';
import * as api from '../utils/api';

type Props = {
  navigation: NavigationScreenProp,
  product: any,
  URL: string,
};

type State = {
  loading: boolean,
  item: {
    seller: Object,
    price: string,
    photoURIs: Array<string>,
    description: string,
    location: string,
  } | null,
};

// @TODO: if Product is mine Delete, Edit
const BUTTONS = ['Report', 'Cancel'];

// const isIOS = Platform.OS === 'ios';

export class Product extends React.Component<Props, State> {
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
            console.log('Cancel');
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

    console.log(params);
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
                  <TouchableHighlight style={styles.flex} onPress={this.goToProfile}>
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
                <Button
                  // disabled
                  // loading
                  buttonStyle={styles.buyButton}
                  title="Buy"
                />
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
