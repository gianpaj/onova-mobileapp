// @flow

import React from 'react';
// prettier-ignore
import {
  Share,
  StyleSheet,
  Text,
  Image,
  Platform,
  View,
} from 'react-native';
// prettier-ignore
import {
  ActionSheet,
  Body,
  Button as NBButton,
  Container,
  Header,
  Icon,
  Left,
  Right,
 } from 'native-base';
// prettier-ignore
import {
  Button,
} from 'react-native-elements';
import MediaView from '../components/MediaView';

import colors from '../config/colors';

const item = {
  keyz: 2,
  username: 'jennifer shop',
  location: 'Lviv, Ukraine',
  price: '640 UAH',
  source:
    'https://github.com/saitoxu/InstaClone/raw/master/contents/images/baking.jpg',
  avatarUrl: 'https://unsplash.it/100?image=1027',
};

type Props = {
  navigation: navigation,
  product: any,
  URL: string,
};

type State = {
  images: Array,
  itemHeight: number,
  loading: boolean,
  loadingMore: boolean,
  refreshing: boolean,
};

// @TODO: if Product is mine Delete, Edit
const BUTTONS = ['Share', 'Copy Link', 'Report', 'Cancel'];

const isIOS = Platform.OS === 'ios';

export default class Product extends React.Component<Props, State> {
  showActionSheet() {
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
          case BUTTONS.indexOf('Share'):
            this.showShareActionSheet();
            break;
          default:
            console.log('Cancel or Copy link');
            break;
        }
      }
    );
  }

  showShareActionSheet() {
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
  }

  render() {
    return (
      <Container style={styles.container}>
        <Header>
          <Left>
            <NBButton transparent dark>
              <Icon
                name={
                  Platform.OS === 'ios' ? 'ios-arrow-back' : 'md-arrow-back'
                }
                onPress={() => this.props.navigation.goBack()}
              />
            </NBButton>
          </Left>
          <Body />
          <Right>
            <NBButton transparent dark>
              <Icon
                name="ios-more"
                style={styles.moreIcon}
                onPress={() => this.showActionSheet()}
              />
            </NBButton>
          </Right>
        </Header>
        <View style={styles.topSection}>
          <Image style={styles.avatar} source={{ uri: item.avatarUrl }} />
          <View style={{ flex: 1, height: 35, marginTop: 12 }}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.location}>{item.location}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.price}>{item.price}</Text>
        </View>
        <MediaView source={item.source} />
        <View style={styles.bottomSection}>
          <Icon name="ios-bookmark-outline" style={styles.iconSave} />
          <Icon name="ios-text-outline" style={styles.iconCommmentAndShare} />
          <Icon
            name="ios-share-outline"
            style={styles.iconCommmentAndShare}
            onPress={() => this.showShareActionSheet()}
          />

          <View style={{ flex: 1 }} />
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
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topSection: {
    backgroundColor: colors.white,
    height: 60,
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    margin: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey5,
  },
  username: {
    fontWeight: 'bold',
    flex: 1,
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
  moreIcon: {
    // marginRight: 15,
  },
  bottomSection: {
    height: 54,
    backgroundColor: colors.white,
    flexDirection: 'row',
  },
  iconSave: {
    marginLeft: 15,
    marginTop: 12,
  },
  iconCommmentAndShare: {
    marginLeft: 20,
    marginTop: 12,
  },
  buyButton: {
    backgroundColor: colors.grey1,
    marginRight: 0,
    marginTop: 9,
    paddingBottom: 8,
    paddingRight: 12,
    paddingTop: 8,
  },
  bottomSectionAfter: {
    marginBottom: 20,
    paddingLeft: 15,
  },
  timeAgo: {
    color: colors.grey3,
    fontSize: 12,
  },
});
