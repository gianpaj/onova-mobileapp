// @flow
// inspired by https://github.com/ElinaSchaefer77/react-native-inline-edit/

import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  autoCorrect: boolean,
  isTextEditable: boolean,
  loading: boolean,
  onChangeText: (text: string) => any,
  placeholder: string,
  placeholderColor: string,
  style?: any,
  text: string,
  textInputProps: any,
  textProps: any,
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
    placeholderColor: '#cccccc',
    loading: false,
    style: {},
    textInputProps: {},
    textProps: {},
  };

  startEditing = () => {
    if (this.props.isTextEditable) {
      this.setState({
        editing: true,
        text: this.props.text,
      });
    }
  };

  onChangeText = (text: string) => {
    this.props.onChangeText(text);
    this.setState({ text });
  };

  renderText() {
    const {
      loading,
      placeholder,
      placeholderColor,
      style,
      textProps,
      text,
    } = this.props;

    if (!this.state.editing && !loading) {
      return (
        <TouchableOpacity onPress={this.startEditing}>
          <Text
            {...textProps}
            style={[style, text ? style : { color: placeholderColor }]}>
            {text || placeholder}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  }

  renderTextInput() {
    const { autoCorrect, loading, placeholder, style } = this.props;

    if (this.state.editing || loading) {
      return (
        <View>
          <View>
            <TextInput
              autoFocus
              autoCorrect={autoCorrect}
              onBlur={() => this.setState({ editing: false })}
              onChangeText={t => this.onChangeText(t)}
              opacity={this.state.editing ? 1 : 0.1}
              returnKeyType={'done'}
              placeholder={placeholder}
              value={this.state.text}
              {...this.props.textInputProps}
              style={style}
            />
          </View>
          {this.renderActivityIndicator()}
        </View>
      );
    }
    return null;
  }

  renderActivityIndicator() {
    if (this.props.loading) {
      return (
        <View style={styles.spinnerStyle}>
          <ActivityIndicator size={'small'} />
        </View>
      );
    }
    return null;
  }

  render() {
    return (
      <View>
        {this.renderText()}
        {this.renderTextInput()}
      </View>
    );
  }
}

export default EditableText;
