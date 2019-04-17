// @flow

// taken from https://github.com/ant-design/ant-design-mobile-rn/blob/e9a80ce5bc0653a6de03bff3c7334e83aa0b4951/components/notice-bar/Marquee.tsx
// MIT License

import React from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import type { ViewStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { type SyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import type { Node } from 'react';

export interface MarqueeProps {
  text?: Node;
  loop?: boolean;
  leading?: number;
  trailing?: number;
  className?: string;
  fps?: number;
  style?: ViewStyleProp;
  maxWidth?: number;
}

class Marquee extends React.PureComponent<MarqueeProps, any> {
  static defaultProps = {
    fps: 10,
    leading: 500,
    loop: false,
    maxWidth: 1000,
    text: '',
    trailing: 800,
  };

  texts: any;
  twidth = 0;
  width = 0;

  state = {
    left: new Animated.Value(0),
  };

  onLayout = (e: SyntheticEvent<any>) => {
    if (this.twidth) return;

    this.twidth = e.nativeEvent.layout.width;
    // onLayout may be earlier than onLayoutContainer on android, cannot be sure width < twidth at that time.
    this.tryStart();
  };

  tryStart() {
    if (this.twidth > this.width && this.width) this.startMove();
  }

  onLayoutContainer = (e: SyntheticEvent<any>) => {
    if (!this.width) {
      this.width = e.nativeEvent.layout.width;
      this.setState(
        {
          left: new Animated.Value(0),
        },
        () => this.tryStart()
      );
    }
  };

  startMove = () => {
    const { fps, loop, leading } = this.props;
    const { width, twidth } = this;

    const speed = (1 / fps) * 1000;

    Animated.timing(this.state.left, {
      toValue: -twidth + width,
      duration: twidth * speed,
      easing: Easing.linear,
      delay: leading,
      isInteraction: false,
    }).start(() => {
      if (loop) this.moveToHeader();
    });
  };

  moveToHeader = () =>
    Animated.timing(this.state.left, {
      toValue: 0,
      duration: 0,
      delay: this.props.trailing,
      isInteraction: false,
    }).start(() => this.startMove());

  textChildren = (
    <Text onLayout={this.onLayout} numberOfLines={1} ellipsizeMode="tail" style={this.props.style}>
      {this.props.text}
    </Text>
  );

  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onLayout={this.onLayoutContainer}>
        <Animated.View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            flexDirection: 'row',
            left: this.state.left,
            width: this.props.maxWidth,
          }}>
          {this.textChildren}
        </Animated.View>
      </View>
    );
  }
}

export default Marquee;
