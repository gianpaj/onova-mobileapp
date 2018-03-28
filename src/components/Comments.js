// @flow

import React from 'react';
import {
  ActivityIndicator,
  // Animated,
  Dimensions,
  FlatList,
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

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';
import type { Comment, Product as ProductType, UserData } from '../types';

type Props = {
  navigation?: NavigationScreenProp<*>,
  uuid: string,
  userData: UserData,
  scrollView: Content,
};

type State = {
  addCommentError: boolean,
  comments: Array<Comment>,
  loading: boolean,
  // likeAnimValue: number,
  usersToMention: Array<UserData>,
  keyword: string,
  text: string,
};

const { height, width } = Dimensions.get('window');

class Comments extends React.Component<Props, State> {
  anim: ?React$Element<*>;
  reqTimer = 0;

  state = {
    addCommentError: false,
    comments: [],
    loading: true,
    // likeAnimValue: new Animated.Value(0.35),
    usersToMention: [],
    keyword: '',
    text: '',
  };

  componentWillMount() {
    let { uuid } = this.props;
    // for development
    if (!uuid) {
      uuid = 'SJWwox8LLG';
    }

    console.log(uuid);

    console.debug('product uuid:', uuid);
    this._getComments(this.props.uuid)
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
      <TouchableOpacity
        // style={{ paddingVertical: 5 }}
        onPress={() =>
          this.props.navigate('user', { id: c.user._id })
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
          <ParsedText
            parse={[
              {
                pattern: /\[(@[a-zA-Zа-яА-Я0-9\_\.]+):([^\]]+)\]/i,
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
    const pattern = /\[(@[a-zA-Zа-яА-Я0-9\_\.]+):([^\]]+)\]/i;
    // input: [@michel:5455345]
    // output: ["[@michel:5455345]", "@michel", "5455345"]
    const matches = matchingString.match(pattern);
    if (!matches) return console.error('error');

    if (matches[2] == 'null') {
      return ui.showToast('User not found', 'warning');
    }
    // $FlowFixMe
    this.goToProfile({ username: matches[2].replace('@', '') });
  };

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

  renderText(string: string, matches: Array<string>) {
    return matches[1];
  }

  renderSuggestionsRow = (
    { item: user }: { item: UserData },
    hidePanel: () => void
  ) => {
    return (
      <TouchableOpacity onPress={() => this.onSuggestionTap(user, hidePanel)}>
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
            uri={user.profilePic || ''}
            placeholderText={user.username}
          />
          <View style={styles.userDetailsBox}>
            <Text style={styles.displayNameText}>{user.displayName}</Text>
            <Text style={styles.suggestionUsernameText}>@{user.username}</Text>
          </View>
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
    // is the text not empty and not longer that the max
    const showActiveOpacity =
      text.trim().length < 1 || text.length == settings.MAX_LENGTH_COMMENT;
    return (
      <View style={styles.addCommentContainer}>
        <View style={styles.addCommentInputContainer}>
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
              // borderWidth: 1,
              backgroundColor: colors.grey5,
              borderColor: colors.grey5,
              borderRadius: 3,
              bottom: 40,
              // hack to hide empty suggestionsPanel for zero chars query or no results
              top: keyword == '@' || usersToMention.length == 0 ? 1100 : 'auto',
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
            keyExtractor={item => item._id}
            MaxVisibleRowCount={7} // this is required if horizontal={false}
            onChangeText={this.onChangeText}
            placeholder="Add a comment"
            renderSuggestionsRow={this.renderSuggestionsRow}
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
  padder: {
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grey4,
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
  mention: {
    color: colors.pDark,
    fontWeight: 'bold',
  },
});

export default Comments;
