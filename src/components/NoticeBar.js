// @flow

// originally taken from https://github.com/ant-design/ant-design-mobile-rn/blob/e9a80ce5bc0653a6de03bff3c7334e83aa0b4951/components/notice-bar/index.tsx
// MIT License

import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import Marquee, { MarqueeProps } from './Marquee';

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
  brand_warning: '#f4333c',
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
    fontSize: 18,
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
    icon: (
      <Image
        // tslint:disable-next-line:jsx-no-multiline-js
        source={{
          uri:
            'https://zos.alipayobjects.com/rmsportal/UgviADRsIpznkjSEXWEaPTlKtPCMSlth.png',
        }}
        style={{ width: 14, height: 12 }}
      />
    ),
    styles: NoticeStyles,
  };

  constructor(props: NoticeNativeProps) {
    super(props);
    this.state = {
      show: true,
    };
  }

  onPress = () => {
    const { mode, onPress } = this.props;
    if (onPress) {
      onPress();
    }
    if (mode === 'closable') {
      this.setState({
        show: false,
      });
    }
  };

  render() {
    const { children, mode, icon, style, action, marqueeProps } = this.props;
    const styles = this.props.styles;

    let operationDom: any = null;
    if (mode === 'closable') {
      operationDom = (
        <TouchableWithoutFeedback onPress={this.onPress}>
          <View style={styles.actionWrap}>
            {action ? action : <Text style={[styles.close]}>×</Text>}
          </View>
        </TouchableWithoutFeedback>
      );
    } else if (mode === 'link') {
      operationDom = (
        <View style={styles.actionWrap}>
          {action ? action : <Text style={[styles.link]}>∟</Text>}
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
    return this.state.show ? (
      mode === 'closable' ? (
        main
      ) : (
        <TouchableWithoutFeedback onPress={this.onPress}>
          {main}
        </TouchableWithoutFeedback>
      )
    ) : null;
  }
}
