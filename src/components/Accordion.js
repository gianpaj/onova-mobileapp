// @flow

import React, { Component } from 'react';
// $FlowFixMe
import { Animated, StyleSheet, View, Text } from 'react-native';
import CollapsibleAccordion from 'react-native-collapsible/Accordion';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FormInput, FormLabel } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';

import colors from '../config/colors';

type Props = {
  duration: number,
  headerText: string,
  values: Array<any>,
};

export default class Accordion extends Component<Props> {
  animatedValue: Animated.Value;

  static defaultProps = {
    duration: 400,
  };

  componentWillMount() {
    this.animatedValue = new Animated.Value(0);
  }

  toggle(i: any) {
    Animated.timing(this.animatedValue, {
      toValue: i === false ? 0 : 1,
      duration: this.props.duration,
    }).start();
  }

  render() {
    const interpolateRotation = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
    const animatedStyle = {
      transform: [{ rotate: interpolateRotation }],
    };
    return (
      <CollapsibleAccordion
        onChange={i => this.toggle(i)}
        touchableProps={{ underlayColor: 'transparent' }}
        sections={this.props.values}
        renderHeader={() => (
          <View style={styles.header}>
            <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>
              {this.props.headerText}
            </FormLabel>
            <Animatable.View style={[styles.arrow, animatedStyle]}>
              <Ionicons name="ios-arrow-down" style={styles.icon} size={24} />
            </Animatable.View>
          </View>
        )}
        renderContent={section =>
          section.content.map((c, i) => (
            <FormInput
              key={i}
              ref={el => {
                c.input = el;
              }}
              autoCorrect={false}
              clearButtonMode="while-editing"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              onChangeText={t => c.onChangeValue(t)}
              placeholder={c.placeholder}
              onSubmitEditing={() =>
                section.content[i + 1] && section.content[i + 1].input.focus()
              }
              returnKeyType="next"
              value={c.value}
            />
          ))
        }
      />
    );
  }
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
  },
  label: {
    color: colors.black,
    fontWeight: '600',
  },
  arrow: {
    marginTop: 13,
    alignSelf: 'flex-start',
  },
  icon: {
    marginTop: -5,
    top: 5,
  },
  inputContainer: {
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  input: {
    color: colors.black,
    width: '100%',
  },
});
