import React from 'react';
import { Keyboard } from 'react-native';
import { TabBarBottom } from 'react-navigation';

// Hide TabBar React Navigation when Keyboard is activated
// e.g when typing while searching with hashtags
class TabBarComponent extends React.PureComponent {
  keyboardDidShowListener;
  keyboardDidHideListener;

  state = {
    isVisible: true,
  };

  componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this.keyboardWillShow
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardWillHide
    );
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  keyboardWillShow = () => this.setState({ isVisible: false });
  keyboardWillHide = () => this.setState({ isVisible: true });

  render() {
    return this.state.isVisible ? <TabBarBottom {...this.props} /> : null;
  }
}

export default TabBarComponent;
