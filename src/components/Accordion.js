// @flow

import React, { PureComponent } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import CollapsibleAccordion from 'react-native-collapsible/Accordion';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FormLabel } from 'react-native-elements';
import { InputItem } from 'antd-mobile-rn';
import * as Animatable from 'react-native-animatable';

import colors from '../config/colors';

type Field = {
  ref: el => void,
  placeholder: string,
  value: string,
  onFocus: () => void,
  onChangeValue: value => void,
  type?: string,
};

type Props = {
  duration: number,
  headerText: string,
  values: Array<Field>,
};

type State = {
  activeSections: Array<number>,
};

export default class Accordion extends PureComponent<Props, State> {
  animatedValue: Animated.Value;

  state = {
    activeSections: [],
  };

  static defaultProps = {
    duration: 400,
  };

  constructor(props: Props) {
    super(props);
    this.animatedValue = new Animated.Value(0);
  }

  toggle = (i: Array<number>) => {
    this.setState({ activeSections: i });
    Animated.timing(this.animatedValue, {
      toValue: i[0] === 0 ? 1 : 0,
      duration: this.props.duration,
      useNativeDriver: true,
    }).start();
  };

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
        activeSections={this.state.activeSections}
        onChange={this.toggle}
        touchableProps={{ underlayColor: 'transparent' }}
        sections={[{ content: this.props.values }]}
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
            <InputItem
              key={i}
              ref={el => {
                c.input = el;
                c.ref(el);
              }}
              autoCorrect={false}
              blurOnSubmit={false}
              clearButtonMode="while-editing"
              // containerStyle={styles.inputContainer}
              // inputStyle={styles.input}
              onChangeText={c.onChangeValue}
              onFocus={c.onFocus}
              placeholder={c.placeholder}
              onSubmitEditing={() =>
                section.content[i + 1] && section.content[i + 1].input.focus()
              }
              type={c.type}
              returnKeyType="next"
              value={c.value}
              last
              error={c.validation && c.value ? !c.validation(c.value) : false}
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
