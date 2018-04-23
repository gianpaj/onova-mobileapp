// @flow
// inspired by https://github.com/Osedea/react-native-interactive-avatar

import React, { PureComponent } from 'react';
import {
  // ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
// import { CachedImage } from 'react-native-cached-image';
import ImagePicker from 'react-native-image-crop-picker';
import { GiftedAvatar } from 'react-native-gifted-chat';
import colors from '../config/colors';

const isiOS = Platform.OS === 'ios';

const PICKER_OPTIONS = {
  maxWidth: 700,
  maxHeight: 700,
  cropping: true,
};

type Props = {
  interactive: boolean,
  onChange?: Image => void, // called on change when interactive is true
  onChangeFailed?: () => void, // called on change failure when interactive is true
  onPress?: () => void,
  overlayColor: string, // On Android only, should be the same than the backgroundColor of the surrounding View
  // pickerOptions?: any,
  placeholderSource?: number,
  placeholderText?: string,
  placeholderURI?: string,
  resizeMode: Image.resizeMode,
  size: string, // oneOf(['default', 'mini', 'verySmall', 'small', 'medium']),
  style?: Image.style,
  uri: string | Image,
  withBorder: boolean,
};

type State = {
  failed: boolean,
};

export default class Avatar extends PureComponent<Props, State> {
  static defaultProps = {
    interactive: false,
    overlayColor: 'transparent',
    resizeMode: 'cover',
    size: 'default',
    withBorder: false,
  };

  state = {
    failed: false,
  };

  handleInteractivePress = () => {
    ImagePicker.openPicker({
      ...PICKER_OPTIONS,
      // ...this.props.pickerOptions,
    })
      .then((response: Image) => {
        this.setState({ failed: false });

        this.props.onChange && this.props.onChange(response);
      })
      .catch(e => {
        if (e.code == 'E_PICKER_CANCELLED') {
          this.setState({
            failed: true,
          });
          if (this.props.onChangeFailed) {
            this.props.onChangeFailed();
          }
        } else {
          console.warn(e);
        }
      });
  };

  getAppropriateSource = () => {
    const { uri } = this.props;

    if (typeof uri == 'object' && uri !== '') {
      return { uri: uri.path };
    }

    if (typeof uri == 'string' && uri !== '') {
      return { uri };
    }

    if (!isiOS && !uri) {
      return this.getPlaceholder();
    }
  };

  getPlaceholder = () => {
    let placeholder = this.props.placeholderSource;

    if (placeholder !== null && this.props.placeholderURI !== undefined) {
      placeholder = { uri: this.props.placeholderURI };
    }

    return placeholder;
  };

  renderAvatarImage = () => {
    const { placeholderText, uri } = this.props;
    let name;

    const allStyles = [
      !isiOS && { overlayColor: this.props.overlayColor },
      styles.avatar,
      styles[`${this.props.size}Avatar`],
      this.props.withBorder ? styles.border : {},
      this.props.interactive ? styles.borderInteractive : {},
      this.props.style,
    ];

    if (!uri && placeholderText !== undefined) {
      name = placeholderText;
      if (placeholderText[0] == '@') {
        name = placeholderText.slice(1);
      }

      return (
        <View>
          <GiftedAvatar
            avatarStyle={allStyles}
            user={{ name }}
            textStyle={styles[`${this.props.size}AvatarPlaceHolderText`]}
          />
        </View>
      );
    }

    return (
      <Image
        defaultSource={this.getPlaceholder()}
        resizeMode={this.props.resizeMode}
        source={this.getAppropriateSource()}
        style={allStyles}
      />
      // <CachedImage source={this.getAppropriateSource()} />
    );
  };

  render() {
    return (
      <TouchableWithoutFeedback
        onPress={() =>
          this.props.onPress
            ? this.props.onPress()
            : this.props.interactive && this.handleInteractivePress()
        }>
        {this.renderAvatarImage()}
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  avatar: {
    // backgroundColor: colors.grey3,
  },
  /* eslint-disable */
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  verySmallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  smallAvatar: {
    width: 50,
    height: 50,
    borderRadius: 26,
  },
  mediumAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultAvatar: {
    width: 125,
    height: 125,
    borderRadius: 63,
  },
  miniAvatarPlaceHolderText: {
    fontSize: 20
  },
  verySmallAvatarPlaceHolderText: {
    fontSize: 23
  },
  smallAvatarPlaceHolderText: {
    fontSize: 40,
  },
  mediumAvatarPlaceHolderText: {
    fontSize: 50,
  },
  defaultAvatarPlaceHolderText: {
    fontSize: 50,
  },
  /* eslint-enable */
  border: {
    borderColor: colors.grey5,
    borderWidth: 2,
  },
  borderInteractive: {
    borderColor: colors.grey2,
    borderWidth: 4,
  },
  // container: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
});
