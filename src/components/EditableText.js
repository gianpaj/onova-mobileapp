// @flow
// inspired by https://github.com/ElinaSchaefer77/react-native-inline-edit/

import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
  type TextProps,
} from 'react-native';
import ParsedText from 'react-native-parsed-text';

import * as linking from '../utils/linking';
import colors from '../config/colors';

type Props = {
  autoCorrect: boolean,
  isTextEditable: boolean,
  loading: boolean,
  onChangeText: (text: string) => void,
  placeholder: string,
  placeholderColor: ?string,
  shouldAutoFocus: boolean,
  showPlaceholder: boolean,
  style?: StyleSheet.Styles,
  text: string,
  textInputProps: any,
  textProps: TextProps,
};

type State = {
  editing: boolean,
  text: string,
};

class EditableText extends PureComponent<Props, State> {
  state = {
    editing: false,
    text: '',
  };

  static defaultProps = {
    autoCorrect: false,
    isTextEditable: true,
    loading: false,
    placeholderColor: '#cccccc',
    shouldAutoFocus: false,
    showPlaceholder: true,
    style: {},
    textInputProps: {},
    textProps: {},
  };

  renderText() {
    const {
      placeholder,
      placeholderColor,
      showPlaceholder,
      style,
      text,
      textProps,
    } = this.props;

    return (
      <ParsedText
        {...textProps}
        parse={[{ type: 'url', style: styles.url, onPress: linking.openURL }]}
        style={[style, !text && { color: placeholderColor }]}>
        {text || (showPlaceholder ? placeholder : '')}
      </ParsedText>
    );
  }

  renderTextInput() {
    const { autoCorrect, placeholder, style } = this.props;

    return (
      <>
        <View style={styles.textInputContainer}>
          <TextInput
            autoCorrect={autoCorrect}
            autoFocus={this.props.shouldAutoFocus}
            clearButtonMode="while-editing" // ios
            onChangeText={t => this.props.onChangeText(t)}
            opacity={this.props.isTextEditable ? 1 : 0.1}
            placeholder={placeholder}
            returnKeyType={'done'}
            style={style}
            underlineColorAndroid={colors.active}
            value={this.props.text}
            {...this.props.textInputProps}
          />
        </View>
        {this.renderActivityIndicator}
      </>
    );
  }

  renderActivityIndicator = this.props.loading && (
    <View style={styles.spinnerStyle}>
      <ActivityIndicator size="small" />
    </View>
  );

  render = () =>
    this.props.isTextEditable || this.props.loading
      ? this.renderTextInput()
      : this.renderText();
}

const styles = StyleSheet.create({
  textInputContainer: {
    // borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: -StyleSheet.hairlineWidth,
  },
  spinnerStyle: {
    position: 'absolute',
  },
  url: {
    color: colors.active,
    textDecorationLine: 'underline',
  },
});

export default EditableText;
