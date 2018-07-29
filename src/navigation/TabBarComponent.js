import React from 'react';
import { Keyboard } from 'react-native';
import { TabBarBottom } from 'react-navigation';

// Hide TabBar React Navigation when Keyboard is activated
// e.g when typing while searching with hashtags
class TabBarComponent extends React.PureComponent {
  state = {
    isVisible: true,
  };

  componentDidMount() {
    this.keyboardWillShowSub = Keyboard.addListener(
      'keyboardDidShow',
      this.keyboardWillShow
    );
    this.keyboardWillHideSub = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardWillHide
    );
  }

  componentWillUnmount() {
    this.keyboardWillShowSub.remove();
    this.keyboardWillHideSub.remove();
  }

  keyboardWillShow = () => this.setState({ isVisible: false });
  keyboardWillHide = () => this.setState({ isVisible: true });

  render() {
    return this.state.isVisible ? <TabBarBottom {...this.props} /> : null;
  }
}

export default TabBarComponent;
