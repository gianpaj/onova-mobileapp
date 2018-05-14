// @flow

import React from 'react';
import {
  ActivityIndicator,
  // Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { ActionSheet, Content } from 'native-base';
// import LottieView from 'lottie-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import { TextareaItem } from 'antd-mobile';
import ParsedText from 'react-native-parsed-text';
import MentionsTextInput from 'react-native-mentions';

import { Avatar, Send } from '../components';

import I18n from '../i18n';
import colors, { convertHex } from '../config/colors';
import settings from '../config/settings';
import typography from '../config/typography';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { Comment, Product as ProductType, UserData } from '../types';

type Props = {
  goToProfile: (user: UserData) => void,
  uuid: string,
  userData: UserData,
  scrollView: Content,
};

type State = {
  // addCommentError: boolean,
  comments: Array<Comment>,
  loading: boolean,
  // likeAnimValue: number,
  usersToMention: Array<UserData>,
  keyword: string,
  text: string,
};

const isiOS = Platform.OS == 'ios';
const { width } = Dimensions.get('window');

class Comments extends React.Component<Props, State> {
  anim: ?React$Element<*>;
  reqTimer = 0;

  state = {
    comments: [],
    loading: true,
    // likeAnimValue: new Animated.Value(0.35),
    usersToMention: [],
    keyword: '',
    text: '',
  };

  componentWillMount() {
    // let { uuid } = this.props;
    // for development
    // if (!uuid) {
    //   uuid = 'SJWwox8LLG';
    // }

    this._getComments(this.props.uuid)
      .then(({ comments }) =>
        this.setState({
          comments,
          loading: false,
        })
      )
      .catch(e => console.error(e));
  }

  _getComments(uuid: string): Promise<ProductType> {
    return new Promise((resolve, reject) => {
      const { token } = this.props.userData;
      api
        .get(`/api/products/${uuid}/comment`, { token })
        .then(({ data }) => resolve(data))
        .catch(e => reject(e));
    });
  }

  showActionSheetForComment = (comment: Comment) => {
    const DELETE = I18n.t('comments.action_button_delete');
    const CANCEL = I18n.t('comments.action_button_cancel');
    let BUTTONS;
    // if its my comment
    // if (comment.user._id == this.props.userData._id) {
    BUTTONS = [DELETE, CANCEL];
    // } else {
    //   BUTTONS = ['Report', CANCEL];
    // }

    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: 0,
        cancelButtonIndex: BUTTONS.indexOf(CANCEL),
      },
      buttonIndex => {
        switch (buttonIndex) {
          // case BUTTONS.indexOf('Report'):
          //   alert('report me like those french girls 🎨');
          //   // report action
          //   break;
          case BUTTONS.indexOf(DELETE):
            ui.showConfirmAlert(
              I18n.t('comments.alert_confirm_deletion'),
              '',
              () => {
                this.deleteComment(comment);
                // this.forceUpdate();
              }
            );
            // report action
            break;
          // case BUTTONS.indexOf('Share'):
          //   this.showShareActionSheet();
          //   break;
          default:
            break;
        }
      }
    );
  };

  deleteComment(comment: Comment) {
    let uuid = this.props.uuid;

    // for development
    if (!uuid) {
      uuid = 'SJWwox8LLG';
    }

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

  renderSingleComment = ({ item: c }: { item: Comment }) => (
    <View style={styles.containerComment}>
      <Avatar
        // $FlowFixMe
        onPress={() => this.props.goToProfile(c.user)}
        size={'verySmall'}
        uri={c.user.profilePic}
        placeholderText={c.user.username}
      />
      <TouchableWithoutFeedback
        onLongPress={() =>
          c.user._id == this.props.userData._id &&
          this.showActionSheetForComment(c)
        }>
        <View style={styles.content}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={() => this.props.goToProfile(c.user)}>
              <Text style={styles.username}>{c.user.username}</Text>
            </TouchableOpacity>
            <Text style={styles.time}>{ui.formatTime(c.createdAt)}</Text>
          </View>
          <ParsedText
            parse={[
              {
                pattern: /\[(@[a-zA-Z0-9\_\.]+):([^\]]+)\]/i,
                style: styles.mention,
                onPress: this.handleNamePress,
                renderText: this.renderText,
              },
            ]}
            childrenProps={{ allowFontScaling: false }}
            style={styles.commentText}>
            {c.text}
          </ParsedText>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );

  handleNamePress = (matchingString: string) => {
    const pattern = /\[(@[a-zA-Z0-9\_\.]+):([^\]]+)\]/i;
    // input: [@michel:5455345]
    // output: ["[@michel:5455345]", "@michel", "5455345"]
    const matches = matchingString.match(pattern);
    if (!matches) return console.error('error');

    if (matches[2] == 'null') {
      return ui.showToast(
        I18n.t('comments.toast_warning_mention_not_found'),
        'warning'
      );
    }
    console.log(matches);
    // $FlowFixMe
    this.props.goToProfile({
      username: matches[1].replace('@', ''),
      _id: matches[2],
    });
  };

  _keyExtractor = item => item._id;

  renderSeparator = () => <View style={styles.separator} />;

  renderComments() {
    if (this.state.comments.length < 1) return null;

    return (
      <View style={styles.padder}>
        <FlatList
          style={styles.root}
          data={this.state.comments}
          ItemSeparatorComponent={this.renderSeparator}
          keyExtractor={this._keyExtractor}
          renderItem={this.renderSingleComment}
        />
      </View>
    );
  }

  renderText = (string: string, matches: Array<string>) => matches[1];

  renderSuggestionsRow = (
    { item: user }: { item: UserData },
    hidePanel: () => void
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.row,
          {
            borderColor: convertHex(colors.grey2, 10),
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
        onPress={() => this.onSuggestionTap(user, hidePanel)}>
        <Avatar
          style={{ marginTop: 2 }}
          size={'verySmall'}
          withBorder
          uri={user.profilePic || ''}
          placeholderText={user.username}
        />
        <View style={styles.userDetailsBox}>
          <Text style={styles.suggestionUsernameText}>@{user.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  onSuggestionTap = (user: UserData, hidePanel: () => void) => {
    hidePanel();
    const comment = this.state.text.slice(0, -this.state.keyword.length);
    this.setState({
      usersToMention: [],
      text: comment + '@' + user.username + ' ',
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
    if (username == '@') return Promise.resolve([]);

    return api
      .get(`api/users?u=${username.replace('@', '')}`)
      .then(res => {
        // if (!res.ok) {
        //   throw new Error('Went wrong');
        // }
        return res;
      })
      .catch(e => console.error(e));
  }

  renderAddComment = () => {
    const { text, keyword, usersToMention } = this.state;
    const { userData } = this.props;
    // is the text not empty and not longer that the max
    const showActiveOpacity =
      text.trim().length < 1 || text.length == settings.MAX_LENGTH_COMMENT;

    const shouldHideSuggestions = keyword == '@' || usersToMention.length == 0;
    return (
      <View style={styles.addCommentContainer}>
        <Avatar
          size={'verySmall'}
          uri={userData.profilePic}
          placeholderText={userData.username}
          style={{ marginLeft: 10, marginTop: 10 }}
        />
        <View
          style={[
            styles.addCommentInputContainer,

            // { height: shouldHideSuggestions ? 40 : 200 },
          ]}>
          <MentionsTextInput
            autoCorrect={false}
            keyboardType="email-address"
            loadingComponent={() =>
              keyword !== '@' && (
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
              )
            }
            // eslint-disable-next-line
            suggestionsPanelStyle={{
              backgroundColor: colors.grey5,
              borderRadius: 3,
              bottom: isiOS ? 40 : 0,
              // hack to hide empty suggestionsPanel for zero chars query or no results
              top: isiOS
                ? shouldHideSuggestions
                  ? 1100
                  : 'auto'
                : shouldHideSuggestions
                  ? 1100
                  : 0,
              left: isiOS ? -12 : 0,
              position: isiOS ? 'absolute' : 'relative',
              right: -47,
            }}
            // eslint-disable-next-line
            textInputStyle={{
              fontSize: 14,
              paddingHorizontal: 3,
            }}
            horizontal={false}
            keyExtractor={item => item._id}
            MaxVisibleRowCount={7} // this is required if horizontal={false}
            onChangeText={this.onChangeText}
            placeholder={I18n.t('comments.add_comment_placeholder')}
            renderSuggestionsRow={this.renderSuggestionsRow}
            suggestionRowHeight={45}
            suggestionsData={this.state.usersToMention} // array of objects
            textInputMaxHeight={80}
            textInputMinHeight={isiOS ? 30 : 50}
            trigger={'@'}
            triggerCallback={this.callback.bind(this)}
            triggerLocation={'anywhere'}
            value={text}
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={{ marginTop: 0 }}>
          <Send text={text} onSend={() => this.onSendComment(text)}>
            <Ionicons
              // eslint-disable-next-line
              style={{ opacity: showActiveOpacity ? 0.7 : 1 }}
              name="md-send"
              size={29}
            />
          </Send>
        </View>
      </View>
    );
  };

  onSendComment = (text: string) => {
    text = text.trim();
    // Remove Multiple New Lines
    text = text.replace(/[\r\n]+/g, '\n');
    // is the text empty or longer that the max
    if (text.length < 1 || text.length == settings.MAX_LENGTH_COMMENT) return;

    const { token } = this.props.userData;

    api
      .post(`/api/products/${this.props.uuid}/comment`, { text }, { token })
      .then(({ data }) => {
        let { comment }: { comment: Comment } = data;

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
          this.props.scrollView._root.scrollToEnd({ animated: true });
        }, 300);
      })
      .catch(e => {
        // this.setState({ addCommentError: true });
        if (e.message && e.message.indexOf('verify your account') > -1) {
          ui.showToast(
            I18n.t('comments.toast_warning_on_unverified_account'),
            'warning'
          );
        } else {
          console.error(e);
        }
        // setTimeout(() => {
        //   this.setState({ addCommentError: false });
        // }, 3000);
      });
  };

  // addCommentError: text.length == settings.MAX_LENGTH_COMMENT,
  onChangeText = (text: string) => this.setState({ text });

  render() {
    return (
      <View>
        {this.renderComments()}
        {this.renderAddComment()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
    color: colors.black,
    fontSize: typography.font_body_size,
    lineHeight: 16,
  },
  time: {
    fontSize: 12,
    color: colors.grey2,
    marginTop: 5,
  },
  username: {
    color: colors.grey2,
    fontSize: 14,
  },
  addCommentInputContainer: {
    paddingVertical: Platform.select({
      ios: 5,
    }),
    marginHorizontal: 10,
    width: width - 49 - 60,
  },
  addCommentContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey6,
    marginVertical: 4,
    flexDirection: 'row',
    paddingVertical: Platform.select({
      ios: 10,
    }),
    // height: 200,
  },
  padder: {
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey5,
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
  suggestionUsernameText: {
    fontSize: 12,
    color: colors.grey2,
  },
  mention: {
    color: colors.active,
  },
});

export default Comments;
