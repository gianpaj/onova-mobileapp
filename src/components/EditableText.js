// @flow
// inspired by https://github.com/ElinaSchaefer77/react-native-inline-edit/

import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextProps,
} from 'react-native';

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

const styles = {
  spinnerStyle: {
    position: 'absolute',
  },
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
      <Text
        {...textProps}
        style={[style, text ? {} : { color: placeholderColor }]}>
        {text || (showPlaceholder ? placeholder : '')}
      </Text>
    );
  }

  renderTextInput() {
    const { autoCorrect, placeholder, style } = this.props;

    return (
      <View>
        <View style={st.textInputContainer}>
          <TextInput
            autoFocus={this.props.shouldAutoFocus}
            autoCorrect={autoCorrect}
            clearButtonMode="while-editing" // ios
            onChangeText={t => this.props.onChangeText(t)}
            opacity={this.props.isTextEditable ? 1 : 0.1}
            returnKeyType={'done'}
            placeholder={placeholder}
            value={this.props.text}
            style={style}
            underlineColorAndroid={colors.black}
            {...this.props.textInputProps}
          />
        </View>
        {this.renderActivityIndicator()}
      </View>
    );
  }

  renderActivityIndicator() {
    if (this.props.loading) {
      return (
        <View style={styles.spinnerStyle}>
          <ActivityIndicator size="small" />
        </View>
      );
    }
    return null;
  }

  render = () => (
    <View>
      {this.props.isTextEditable || this.props.loading
        ? this.renderTextInput()
        : this.renderText()}
    </View>
  );
}

const st = StyleSheet.create({
  textInputContainer: {
    // borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: -StyleSheet.hairlineWidth,
  },
});

export default EditableText;
