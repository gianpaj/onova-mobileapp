// @flow
// inspired by https://github.com/Osedea/react-native-interactive-avatar

import React, { Component } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
  View,
  // $FlowFixMe
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
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
  pickerOptions?: any,
  placeholderSource: number,
  placeholderText?: string,
  placeholderURI?: string,
  resizeMode: Image.resizeMode,
  size: string, // oneOf(['default', 'mini', 'verySmall', 'small', 'medium']),
  source?: Image.source,
  style?: Image.style,
  uri: string,
  withBorder: boolean,
};

type State = {
  failed: boolean,
  source?: any,
};

export default class Avatar extends Component<Props, State> {
  static defaultProps = {
    interactive: false,
    overlayColor: colors.white,
    resizeMode: 'cover',
    size: 'default',
    withBorder: false,
  };

  state = {
    failed: false,
    source: null,
  };

  handleInteractivePress = () => {
    console.log('handleInteractivePress');
    ImagePicker.openPicker({
      ...PICKER_OPTIONS,
      ...this.props.pickerOptions,
    })
      .then((response: Image) => {
        const source = {
          uri: response.path,
          // scale
        };

        this.setState({ source, failed: false });
        if (this.props.onChange) {
          this.props.onChange(response);
        }
      })
      .catch(e => {
        if (e.code == ImagePicker) {
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
    let { source, uri } = this.props;

    if (uri !== '') {
      source = { uri };
    }

    if (!isiOS && !source) {
      source = this.getPlaceholder();
    }

    return source;
  };

  getPlaceholder = () => {
    let placeholder = this.props.placeholderSource;

    if (!placeholder && this.props.placeholderURI !== undefined) {
      placeholder = { uri: this.props.placeholderURI };
    }

    return placeholder;
  };

  renderAvatarImage = () => {
    const { placeholderText } = this.props;
    const { source } = this.state;
    if (!source && placeholderText !== undefined) {
      return (
        <View
          style={[
            !isiOS && { overlayColor: this.props.overlayColor },
            styles.avatarContainer,
            styles[`${this.props.size}Avatar`],
            this.props.withBorder ? styles.border : {},
            this.props.style,
          ]}>
          <Text style={styles.text}>{placeholderText}</Text>
        </View>
      );
    }

    return (
      <Image
        style={[
          !isiOS && { overlayColor: this.props.overlayColor },
          styles.avatar,
          styles[`${this.props.size}Avatar`],
          this.props.withBorder ? styles.border : {},
          this.props.style,
        ]}
        defaultSource={this.getPlaceholder()}
        resizeMode={this.props.resizeMode}
        source={this.state.source || this.getAppropriateSource()}
      />
    );
  };

  render() {
    if (this.props.onPress) {
      return (
        <TouchableWithoutFeedback onPress={this.props.onPress}>
          {this.renderAvatarImage()}
        </TouchableWithoutFeedback>
      );
    }
    if (this.props.interactive) {
      return (
        <TouchableWithoutFeedback onPress={this.handleInteractivePress}>
          {this.renderAvatarImage()}
        </TouchableWithoutFeedback>
      );
    }

    return this.renderAvatarImage();
  }
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.grey3,
  },
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: colors.grey3,
    borderColor: colors.grey4,
    borderRadius: 75,
    borderWidth: 1 / 2,
    height: 150,
    justifyContent: 'center',
    width: 150,
  },
  text: {
    color: colors.white,
    fontSize: 28,
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
  /* eslint-enable */
  border: {
    borderColor: colors.grey5,
    borderWidth: 2,
  },
});
