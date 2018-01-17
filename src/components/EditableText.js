// @flow
// inspired by https://github.com/ElinaSchaefer77/react-native-inline-edit/

import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  // $FlowFixMe
} from 'react-native';

type Props = {
  autoCorrect: boolean,
  isTextEditable: boolean,
  loading: boolean,
  sendText: (text: string) => any,
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

class EditableText extends React.Component<Props, State> {
  state = {
    editing: false,
    text: '',
  };

  static defaultProps = {
    autoCorrect: false,
    isTextEditable: true,
    loading: false,
    textInputProps: {},
    textProps: {},
  };

  // constructor(props: Props) {
  //   super(props);
  // }

  startEditing = () => {
    if (this.props.isTextEditable) {
      this.setState({
        editing: true,
        text: this.props.text
      });
    }
  };

  stopEditing = () => {
    this.props.sendText(this.state.text);
    this.setState({ editing: false });
  };

  renderText() {
    if (!this.state.editing && !this.props.loading) {
      return (
        <TouchableOpacity onPress={this.startEditing}>
          <Text {...this.props.textProps}>{this.props.text}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  }

  renderTextInput() {
    const { autoCorrect, loading } = this.props;

    if (this.state.editing || loading) {
      return (
        <View>
          <View>
            <TextInput
              autoFocus
              autoCorrect={autoCorrect}
              onBlur={this.stopEditing}
              onChangeText={text => this.setState({ text })}
              opacity={this.state.editing ? 1 : 0.1}
              returnKeyType={'done'}
              value={this.state.text}
              {...this.props.textInputProps}
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
