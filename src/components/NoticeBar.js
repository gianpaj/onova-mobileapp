// @flow

// originally taken from https://github.com/ant-design/ant-design-mobile-rn/blob/e9a80ce5bc0653a6de03bff3c7334e83aa0b4951/components/notice-bar/index.tsx
// MIT License

import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Marquee, { MarqueeProps } from './Marquee';
import colors from '../config/colors';

interface INoticeBarStyle {
  notice: ViewStyle;
  container: ViewStyle;
  content: TextStyle;
  left6: ViewStyle;
  left15: ViewStyle;
  actionWrap: ViewStyle;
  close: TextStyle;
  link: TextStyle;
}

const variables = {
  notice_bar_fill: '#fffada',
  notice_bar_height: 36,
  h_spacing_lg: 15,
  font_size_subhead: 15,
  brand_warning: colors.red,
  h_spacing_sm: 5,
  font_size_icontext: 10,
};

const NoticeStyle = {
  notice: {
    backgroundColor: variables.notice_bar_fill,
    height: variables.notice_bar_height,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    marginRight: variables.h_spacing_lg,
    overflow: 'hidden',
    width: 0, // ios bug: width size is wrong (usecase: with react-navigation).
  },
  content: {
    fontSize: variables.font_size_subhead,
    color: variables.brand_warning,
  },
  left6: {
    marginLeft: variables.h_spacing_sm,
  },
  left15: {
    marginLeft: variables.h_spacing_lg,
  },
  actionWrap: {
    marginRight: variables.h_spacing_lg,
  },
  close: {
    color: variables.brand_warning,
    fontSize: 16,
    fontWeight: '200',
    textAlign: 'left',
  },
  link: {
    transform: [{ rotate: '225deg' }],
    color: variables.brand_warning,
    fontSize: variables.font_size_icontext,
    fontWeight: '500',
    textAlign: 'left',
  },
};

type NoticeNativeProps = {
  action?: React.ReactElement<any>,
  buttonText: string,
  children: string,
  icon?: React.ReactElement<any>,
  marqueeProps?: MarqueeProps,
  mode?: 'closable' | 'link',
  onPress?: () => void,
  style?: StyleProp<ViewStyle>,
  styles?: INoticeBarStyle,
};

const NoticeStyles = StyleSheet.create(NoticeStyle);

export default class NoticeBar extends React.Component<NoticeNativeProps, any> {
  static defaultProps = {
    mode: '',
    onPress() {},
    icon: null,
    styles: NoticeStyles,
  };

  state = {
    show: true,
  };

  onPress = () => {
    const { mode, onPress } = this.props;
    if (onPress) onPress();

    if (mode === 'closable') this.setState({ show: false });
  };

  render() {
    const {
      buttonText,
      styles,
      children,
      mode,
      icon,
      style,
      action,
      marqueeProps,
    } = this.props;

    let operationDom: any = null;
    if (mode === 'button') {
      operationDom = (
        <TouchableOpacity onPress={this.onPress}>
          <View style={styles.actionWrap}>
            {action ? action : <Text style={styles.close}>{buttonText}</Text>}
          </View>
        </TouchableOpacity>
      );
    } else if (mode === 'closable') {
      operationDom = (
        <TouchableOpacity onPress={this.onPress}>
          <View style={styles.actionWrap}>
            {action ? action : <Text style={styles.close}>×</Text>}
          </View>
        </TouchableOpacity>
      );
    } else if (mode === 'link') {
      operationDom = (
        <View style={styles.actionWrap}>
          {action ? action : <Text style={styles.link}>∟</Text>}
        </View>
      );
    }

    const main = (
      <View style={[styles.notice, style]}>
        {icon && <View style={styles.left15}>{icon}</View>}
        <View style={[styles.container, icon ? styles.left6 : styles.left15]}>
          <Marquee style={styles.content} text={children} {...marqueeProps} />
        </View>
        {operationDom}
      </View>
    );
    if (!this.state.show) return null;
    return mode === 'closable' ? (
      main
    ) : (
      <TouchableOpacity onPress={this.onPress}>{main}</TouchableOpacity>
    );
  }
}
