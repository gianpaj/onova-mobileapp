// @flow

import React, { PureComponent } from 'react';
import { Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = {
  color: string,
  size: number,
  styleContainer: any,
};

export default class SpinningIcon extends PureComponent<Props> {
  spinValue = new Animated.Value(0);

  componentDidMount() {
    this.spin();
  }

  spin = () => {
    this.spinValue.setValue(0);

    Animated.timing(this.spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => this.spin());
  };

  render() {
    const { color, size, styleContainer } = this.props;
    const rotate = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          // eslint-disable-next-line
          { backgroundColor: 'transparent', transform: [{ rotate }] },
          styleContainer,
        ]}>
        <Icon color={color} name="loading" size={size} {...this.props} />
      </Animated.View>
    );
  }
}
