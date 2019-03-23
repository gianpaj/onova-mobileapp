// @flow

import PropTypes from 'prop-types';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewPropTypes,
} from 'react-native';

export default function Send({
  text,
  containerStyle,
  onSend,
  children,
  textStyle,
  label,
  disabled,
}: {
  text: string,
  containerStyle: any,
  onSend: ({ text: string }, boolean) => void,
  children: any,
  textStyle: any,
  label: string,
  disabled: boolean,
}) {
  const isDisabled = disabled || text.trim().length < 1;
  return (
    <TouchableOpacity
      accessibilityTraits="button"
      disabled={isDisabled}
      onPress={() => onSend({ text: text.trim() }, true)}
      style={[styles.container, containerStyle]}>
      <>{children || <Text style={[styles.text, textStyle]}>{label}</Text>}</>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    justifyContent: 'flex-end',
  },
  text: {
    fontWeight: '600',
    fontSize: 17,
    // backgroundColor: Color.backgroundTransparent,
    marginBottom: 12,
    marginLeft: 10,
    marginRight: 10,
  },
});

Send.defaultProps = {
  text: '',
  onSend: () => {},
  label: 'Send',
  containerStyle: {},
  textStyle: {},
  children: null,
};

Send.propTypes = {
  text: PropTypes.string,
  onSend: PropTypes.func,
  label: PropTypes.string,
  containerStyle: ViewPropTypes.style,
  textStyle: Text.propTypes.style,
  children: PropTypes.element,
};
