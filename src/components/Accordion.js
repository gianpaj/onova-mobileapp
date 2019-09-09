// @flow

import React, { Component } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import CollapsibleAccordion from 'react-native-collapsible/Accordion';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FormLabel } from 'react-native-elements';
import { InputItem } from 'antd-mobile-rn';
import * as Animatable from 'react-native-animatable';

import type { Node, Ref } from 'react';

import colors from '../config/colors';

type Field = {
  ref?: (Ref<any>) => any,
  error?: boolean,
  input?: Node, // used to store the ref and later be able to focus on next input field when the Next button is pressed (on the keyboard)
  onChangeText?: string => void,
  onFocus: () => void,
  placeholder: string,
  render?: (props: any) => Node,
  shouldShowError?: () => boolean,
  type?: string,
  value: string,
};

type Props = {
  duration: number,
  headerText: string,
  values: Array<Field>,
  expanded: boolean,
};

type State = {
  activeSections: Array<number>,
};

export default class Accordion extends Component<Props, State> {
  animatedValue: Animated.Value;

  state = {
    activeSections: [],
    expanded: false,
  };

  static defaultProps = {
    duration: 400,
    expanded: false,
  };

  constructor(props: Props) {
    super(props);
    this.animatedValue = new Animated.Value(0);
  }

  componentDidMount() {
    if (this.props.expanded) this.toggle([0]);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.props.expanded !== nextProps.expanded ||
      this.state.activeSections.length !== nextState.activeSections.length
    )
      return true;
    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.expanded && !prevState.expanded) {
      this.setState({ expanded: true });
      this.toggle([0]);
    } else if (!this.props.expanded && prevState.expanded) {
      this.setState({ expanded: false });
      this.toggle([]);
    }
  }

  toggle = (i: Array<number>) => {
    const expanded = i[0] === 0;
    this.setState({ activeSections: i, expanded });
    Animated.timing(this.animatedValue, {
      toValue: expanded ? 1 : 0,
      duration: this.props.duration,
      useNativeDriver: true,
    }).start();
  };

  renderHeader = () => {
    const interpolateRotation = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
    const animatedStyle = {
      transform: [{ rotate: interpolateRotation }],
    };
    return (
      <View style={styles.header}>
        <FormLabel labelStyle={styles.label}>{this.props.headerText}</FormLabel>
        <Animatable.View style={[styles.arrow, animatedStyle]}>
          <Ionicons name="ios-arrow-down" style={styles.icon} size={24} />
        </Animatable.View>
      </View>
    );
  };

  render() {
    return (
      <CollapsibleAccordion
        activeSections={this.state.activeSections}
        onChange={this.toggle}
        touchableProps={{ underlayColor: 'transparent' }}
        sections={[{ content: this.props.values }]}
        renderHeader={this.renderHeader}
        renderContent={section =>
          section.content.map((c, i) => {
            const props = {
              key: i,
              autoCorrect: false,
              blurOnSubmit: false,
              clearButtonMode: 'while-editing',
              error: c.shouldShowError ? !c.shouldShowError() : false,
              last: true, // to remove borderBottomWidth
              onFocus: t => c.onFocus && c.onFocus(t),
              onSubmitEditing: t => c.onSubmitEditing && c.onSubmitEditing(t),
              // onSubmitEditing: () =>
              //   section.content[i + 1] && section.content[i + 1].input.focus(),
              returnKeyType: 'next',
              ...c,
            };
            return c.render ? (
              c.render({ ...props })
            ) : (
              <InputItem
                {...props}
                ref={el => {
                  c.input = el;
                  c.ref(el);
                }}
              />
            );
          })
        }
      />
    );
  }
}

const styles = StyleSheet.create({
  arrow: {
    alignSelf: 'flex-start',
    marginTop: 13,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
  },
  icon: {
    marginTop: -5,
    top: 5,
  },
  label: {
    color: colors.black,
    fontWeight: '600',
    paddingBottom: 10,
  },
});
