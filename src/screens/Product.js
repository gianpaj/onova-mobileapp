// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  ActivityIndicator,
  // Animated,
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import Ionicons from 'react-native-vector-icons/Ionicons';
// import { TextareaItem } from 'antd-mobile';
import MentionsTextInput from 'react-native-mentions';

import { Avatar, MediaView, Send } from '../components';

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { MapStateToProps } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import type {
  Comment,
  Product as ProductType,
  UserData,
  ReduxState,
} from '../types';

type Props = {
  navigation: NavigationScreenProp<*>,
  product: ProductType,
  URL: string,
  userData: UserData,
};

type State = {
  addCommentError: boolean,
  comments: Array<Comment>,
  loading: boolean,
  loadingBuy: boolean,
  item: ProductType | {},
  // likeAnimValue: number,
  usersToMention: Array<UserData>,
  keyword: string,
  text: string,
  visibleHeight: number,
};

const { height, width } = Dimensions.get('window');

// const isIOS = Platform.OS === 'ios';

export class ProductContainer extends React.Component<Props, State> {
  anim: ?React$Element<*>;
  scrollView: Content;
  reqTimer = 0;
  keyboardDidShowListener: any; // EmitterSubscription

  state = {
    addCommentError: false,
    comments: [],
    loading: true,
    loadingBuy: false,
    // likeAnimValue: new Animated.Value(0.35),
    item: {},
    usersToMention: [],
    keyword: '',
    text: '',
    visibleHeight: 0,
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

  showActionSheetForComment = (comment: Comment) => {
    let BUTTONS;
    // if its my comment
    if (comment.user._id == this.props.userData._id) {
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
              this.deleteComment(comment);
              // this.forceUpdate();
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

  deleteComment(comment: Comment) {
    const { uuid } = this.props.navigation.state.params;
    const { token } = this.props.userData;
    api
      .del(`/api/products/${uuid}/comment/${comment._id}`, { token })
      .then(({ data }) => {
        // $FlowFixMe
        const comments = this.state.comments.filter(c => c._id !== comment._id);

        if (data.length !== comments.length) {
          return console.error('reload comments');
        }
        this.setState({ comments });
      })
      .catch(e => console.error(e));
  }

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

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    // this.keyboardDidHideListener.remove();
  }

  componentWillMount() {
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow
    );
    this.setState({ visibleHeight: height });
    // this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);

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
    this._getComments(uuid)
      .then(({ comments }) => {
        this.setState({
          comments,
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

  _getComments(uuid: string): Promise<ProductType> {
    return new Promise((resolve, reject) => {
      const { token } = this.props.userData;
      api
        .get(`/api/products/${uuid}/comment`, { token })
        .then(res => resolve(res.data))
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

  renderSingleComment = ({ item: c }: { item: Comment }) => (
    <View style={styles.containerComment}>
      <TouchableOpacity
        // style={{ paddingVertical: 5 }}
        onPress={() =>
          this.props.navigation.navigate('user', { id: c.user._id })
        }>
        <Avatar
          size={'verySmall'}
          // withBorder
          uri={c.user.profilePic}
          placeholderText={c.user.displayName}
        />
      </TouchableOpacity>
      <TouchableWithoutFeedback
        onLongPress={() => this.showActionSheetForComment(c)}>
        <View style={styles.content}>
          <View style={styles.commentHeader}>
            <Text style={styles.displayName}>{c.user.displayName}</Text>
            <Text style={styles.time}>{ui.formatTime(c.createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{c.text}</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );

  _keyExtractor = item => item._id;

  renderSeparator = () => <View style={styles.separator} />;

  renderComments() {
    return (
      this.state.comments !== null && (
        <View style={styles.padder}>
          <FlatList
            style={styles.root}
            data={this.state.comments}
            extraData={this.state}
            ItemSeparatorComponent={this.renderSeparator}
            keyExtractor={this._keyExtractor}
            renderItem={this.renderSingleComment}
          />
        </View>
      )
    );
  }

  _keyboardDidShow = e => {
    console.log(height - e.endCoordinates.height);
    this.setState({ visibleHeight: height - e.endCoordinates.height });
  };

  renderSuggestionsRow({ item }: { item: UserData }, hidePanel: () => void) {
    return (
      <TouchableOpacity
        onPress={() => this.onSuggestionTap(item.username, hidePanel)}>
        <View
          style={[
            styles.row,
            {
              borderColor: colors.convertHex(colors.grey2, 10),
              borderWidth: StyleSheet.hairlineWidth,
            },
          ]}>
          <Avatar
            // style={styles.avatarContainer}
            size={'verySmall'}
            withBorder
            uri={item.profilePic}
            placeholderText={item.username}
          />
          <View style={styles.userDetailsBox}>
            <Text style={styles.displayNameText}>{item.displayName}</Text>
            <Text style={styles.suggestionUsernameText}>@{item.username}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  onSuggestionTap = (username: string, hidePanel: () => void) => {
    hidePanel();
    const comment = this.state.text.slice(0, -this.state.keyword.length);
    this.setState({
      usersToMention: [],
      text: comment + '@' + username + ' ',
    });
  };

  callback(keyword: string) {
    if (this.reqTimer) {
      clearTimeout(this.reqTimer);
    }

    // TODO: don't autosuggest until you type 1 character
    // TODO: don't autosuggest if you type multiple @ signs
    // if (keyword == '@') return;
    this.reqTimer = setTimeout(() => {
      this.getUserSuggestions(keyword)
        .then(data => {
          // TODO: don't autosuggest already mentioned usernames
          this.setState({
            keyword: keyword,
            usersToMention: [...data],
          });
        })
        .catch(err => {
          console.log(err);
        });
    }, 200);
  }

  getUserSuggestions(username: string = ''): Promise<Array<any>> {
    const data = [
      {
        accountStatus: 'verified',
        id: '5a78d09e2d314a702698f957',
        username: 'john',
        displayName: 'John John',
      },
      {
        accountStatus: 'verified',
        id: '5a78d09d2d314a702698f955',
        username: 'maria',
        displayName: 'Maria Maria',
      },
      {
        accountStatus: 'verified',
        id: '5a78d09e2d314a702698f959',
        username: 'barry',
        displayName: 'barry barry',
      },
      {
        accountStatus: 'verified',
        id: '5a78d09d2d314a702698f956',
        username: 'doc',
        displayName: 'doc doc',
      },
      {
        accountStatus: 'verified',
        id: '5a78d09e2d314a702698f958',
        username: 'joseph',
        displayName: 'joseph joseph',
      },
      {
        accountStatus: 'verified',
        id: '5a78d09d2d314a702698f959',
        username: 'jaysus',
        displayName: 'jaysus jaysus',
      },
      {
        accountStatus: 'verified',
        id: '5a78d09e2d314a702698f962',
        username: 'xavier',
        displayName: 'xavier xavier',
      },
      {
        accountStatus: 'verified',
        id: '5a78d09d2d314a702698f961',
        username: 'zorro',
        displayName: 'zorro zorro',
      },
    ];

    return Promise.resolve(
      data
      // data.filter(user => this.fuzzysearch(username, user.username))
    );

    // return api.get(`http://localhost:8080/?username=${displayName.slice(1)}`, {
    //   method: 'GET',
    //   headers: {
    //     'Content-type': 'application/json',
    //   },
    // }).then(res => {
    //   console.log(res);
    //   if (!res.ok) {
    //     throw new Error('Went wrong');
    //   }
    //   return res.json();
    // });
  }

  fuzzysearch(needle: string, haystack: string): Boolean {
    var hlen = haystack.length;
    var nlen = needle.length;
    if (nlen > hlen) {
      return false;
    }
    if (nlen === hlen) {
      return needle === haystack;
    }
    outer: for (var i = 0, j = 0; i < nlen; i++) {
      var nch = needle.charCodeAt(i);
      while (j < hlen) {
        if (haystack.charCodeAt(j++) === nch) {
          continue outer;
        }
      }
      return false;
    }
    return true;
  }

  renderAddComment = () => {
    const { text } = this.state;
    // is the text not empty and not longer that the max
    const showActiveOpacity =
      text.trim().length < 1 || text.length == settings.MAX_LENGTH_COMMENT;
    return (
      <View style={styles.addCommentContainer}>
        <View style={styles.addCommentInputContainer}>
          <MentionsTextInput
            autoCorrect={false}
            keyboardType="email-address"
            loadingComponent={() => (
              <View
                // eslint-disable-next-line
                style={{
                  flex: 1,
                  width,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator />
              </View>
            )}
            // eslint-disable-next-line
            suggestionsPanelStyle={{
              // borderWidth: 1,
              backgroundColor: colors.grey5,
              borderColor: colors.grey5,
              borderRadius: 3,
              bottom: 40,
              left: -12,
              position: 'absolute',
              right: -47,
            }}
            // eslint-disable-next-line
            textInputStyle={{
              fontSize: 15,
              paddingHorizontal: 3,
            }}
            horizontal={false}
            keyExtractor={item => item.id}
            MaxVisibleRowCount={7} // this is required if horizontal={false}
            onChangeText={this.onChangeText}
            renderSuggestionsRow={this.renderSuggestionsRow.bind(this)}
            suggestionRowHeight={45}
            suggestionsData={this.state.usersToMention} // array of objects
            textInputMaxHeight={80}
            textInputMinHeight={30}
            trigger={'@'}
            triggerCallback={this.callback.bind(this)}
            triggerLocation={'anywhere'}
            value={text}
          />
        </View>
        <Send text={text} onSend={() => this.onSendComment(text)}>
          <Ionicons
            // eslint-disable-next-line
            style={{
              marginBottom: 5,
              opacity: showActiveOpacity ? 0.7 : 1,
            }}
            name="md-send"
            size={29}
          />
        </Send>
      </View>
    );
  };

  onSendComment = (text: string) => {
    // is the text empty or longer that the max
    if (text.trim().length < 1 || text.length == settings.MAX_LENGTH_COMMENT)
      return;

    const self = this;
    const { token } = this.props.userData;

    api
      .post(
        `/api/products/${this.state.item.uuid}/comment`,
        { text },
        { token }
      )
      .then(({ data }) => {
        let { comment, uuid }: { comment: Comment, uuid: string } = data;

        comment = {
          ...comment,
          user: this.props.userData,
        };

        this.setState({
          text: '',
          comments: [...this.state.comments, comment],
        });
        // Keyboard.dismiss();
        setTimeout(() => {
          self.scrollView._root.scrollToEnd({ animated: true });
        }, 300);
      })
      .catch(e => {
        this.setState({ addCommentError: true });
        console.error(e);
        setTimeout(() => {
          this.setState({ addCommentError: false });
        }, 3000);
      });
  };

  onChangeText = (t: string) => {
    this.setState({
      addCommentError: t.length == settings.MAX_LENGTH_COMMENT,
      text: t,
    });
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
          {Object.keys(item).length !== 0 && (
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
              <View style={[styles.padder, styles.bottomSectionAfter]}>
                {/* // $FlowFixMe */}
                <Text style={styles.description}>{item.description}</Text>
              </View>
              {this.renderComments()}
              {this.renderAddComment()}
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
  containerComment: {
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    marginLeft: 16,
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentText: {
    color: colors.grey1,
    fontSize: 17,
    lineHeight: 16,
  },
  time: {
    fontSize: 15,
    color: colors.grey2,
    marginTop: 5,
  },
  displayName: {
    fontSize: 20,
  },
  addCommentInputContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 2,
    paddingVertical: 5,
    margin: 10,
    width: 320,
  },
  addCommentContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
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
  iconCommmentAndShare: {
    // marginLeft: 20,
    marginTop: 12,
  },
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey4,
  },
  row: {
    flexDirection: 'row',
  },
  // timeAgo: {
  //   color: colors.grey3,
  //   fontSize: 12,
  // },
  userDetailsBox: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 15,
  },
  displayNameText: {
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionUsernameText: {
    fontSize: 12,
    color: colors.grey2,
  },
});

const mapStateToProps: MapStateToProps<*, *, *> = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const Product = connect(mapStateToProps)(ProductContainer);
