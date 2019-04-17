// @flow
// inspired by https://github.com/Osedea/react-native-interactive-avatar

import React, { PureComponent } from 'react';
import { Image, PixelRatio, Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import { CachedImage } from 'react-native-cached-image';
import ImagePicker from 'react-native-image-crop-picker';
import { GiftedAvatar } from 'react-native-gifted-chat';

import type { ImageStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

import colors from '../config/colors';

const isiOS = Platform.OS === 'ios';

const PICKER_OPTIONS = {
  maxWidth: 700,
  maxHeight: 700,
  cropping: true,
  cropperCircleOverlay: true,
  compressImageQuality: 0.7,
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
  resizeMode: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat',
  size: 'default' | 'mini' | 'verySmall' | 'small' | 'medium',
  style?: ImageStyleProp,
  uri: string | Image | undefined,
  withBorder: boolean,
  withButton?: boolean, // to show an button to follow or not
  onButtonPress?: () => void | Promise<void>,
  buttonActiveState?: boolean, // to show an button to follow or to unfollow
};

export default class Avatar extends PureComponent<Props, *> {
  static defaultProps = {
    interactive: false,
    overlayColor: 'transparent',
    resizeMode: 'cover',
    size: 'default',
    withBorder: false,
    withButton: false,
  };

  handleInteractivePress = () => {
    ImagePicker.openPicker({
      ...PICKER_OPTIONS,
      // ...this.props.pickerOptions,
    })
      .then((response: Image) => {
        this.props.onChange && this.props.onChange(response);
      })
      .catch(e => {
        if (e.code == 'E_PICKER_CANCELLED') {
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

    if (typeof uri == 'object') {
      // $FlowFixMe
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
    const {
      buttonActiveState,
      interactive,
      onButtonPress,
      overlayColor,
      placeholderText,
      resizeMode,
      size,
      style,
      uri,
      withBorder,
      withButton,
    } = this.props;
    let name, Avatar;

    const allStyles = [
      // styles.avatar,
      styles[`${size}Avatar`],
      withBorder ? styles.border : {},
      interactive ? styles.borderInteractive : {},
      style,
    ];

    if (!uri && placeholderText !== undefined) {
      name = placeholderText;
      if (placeholderText[0] == '@') {
        name = placeholderText.slice(1);
      }

      Avatar = (
        <GiftedAvatar avatarStyle={allStyles} user={{ name }} textStyle={styles[`${size}AvatarPlaceHolderText`]} />
      );
    } else {
      Avatar = (
        <Image
          defaultSource={this.getPlaceholder()}
          resizeMode={resizeMode}
          source={this.getAppropriateSource()}
          style={[!isiOS && { overlayColor }, allStyles]}
        />
        // <CachedImage source={this.getAppropriateSource()} />
      );
    }

    if (!withButton) return Avatar;

    return (
      <View>
        {Avatar}
        <TouchableOpacity onPress={onButtonPress} style={styles.button}>
          <Ionicons
            color={buttonActiveState ? colors.grey4 : colors.active}
            name={buttonActiveState ? 'ios-checkmark-circle' : 'md-add-circle'}
            size={25}
          />
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const { onPress, interactive } = this.props;

    if (!onPress && !interactive) {
      return this.renderAvatarImage();
    }

    return (
      <TouchableOpacity onPress={() => (onPress ? onPress() : interactive && this.handleInteractivePress())}>
        {this.renderAvatarImage()}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderColor: colors.white,
    borderRadius: 25,
    height: 40,
    width: 40,
    padding: 5,
    justifyContent: 'center',
    right: -8,
    top: -19,
  },
  /* eslint-disable */
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  verySmallAvatar: {
    width: 30,
    height: 30,
    borderRadius: Platform.select({
      ios: 30 / PixelRatio.get(),
      android: 20,
    }),
  },
  smallAvatar: {
    width: 50,
    height: 50,
    borderRadius: Platform.select({
      ios: 50 / PixelRatio.get(),
      android: 26,
    }),
  },
  mediumAvatar: {
    width: 60,
    height: 60,
    borderRadius: Platform.select({
      ios: 60 / PixelRatio.get(),
      android: 40,
    }),
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: Platform.select({
      ios: 100 / PixelRatio.get(),
      android: 63,
    }),
  },
  miniAvatarPlaceHolderText: {
    fontSize: 20,
  },
  verySmallAvatarPlaceHolderText: {
    fontSize: 23,
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
    borderWidth: 1,
  },
  borderInteractive: {
    borderColor: colors.active,
    borderWidth: 2,
  },
});
