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

type Props = {
  autoCorrect: boolean,
  isTextEditable: boolean,
  loading: boolean,
  onChangeText: (text: string) => void,
  placeholder: string,
  placeholderColor: string,
  shouldAutoFocus: boolean,
  style?: StyleSheet.Styles,
  text: string,
  textInputProps: any,
  textProps: TextProps,
};

type State = {
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
    placeholderColor: '#cccccc',
    loading: false,
    style: {},
    shouldAutoFocus: false,
    textInputProps: {},
    textProps: {},
  };

  onChangeText = (text: string) => {
    this.props.onChangeText(text);
    this.setState({ text });
  };

  renderText() {
    const {
      placeholder,
      placeholderColor,
      style,
      textProps,
      text,
    } = this.props;

    return (
      <Text
        {...textProps}
        style={[style, text ? {} : { color: placeholderColor }]}>
        {text || placeholder}
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
            onChangeText={t => this.onChangeText(t)}
            opacity={this.props.isTextEditable ? 1 : 0.1}
            returnKeyType={'done'}
            placeholder={placeholder}
            value={this.state.text}
            style={style}
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

  render() {
    return (
      <View>
        {this.props.isTextEditable || this.props.loading
          ? this.renderTextInput()
          : this.renderText()}
      </View>
    );
  }
}

const st = StyleSheet.create({
  textInputContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: -StyleSheet.hairlineWidth,
  },
});

export default EditableText;
