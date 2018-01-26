import PropTypes from 'prop-types';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewPropTypes,
} from 'react-native';

export default function Send({
  text,
  containerStyle,
  onSend,
  children,
  textStyle,
  label,
}) {
  const isDisabled = text.trim().length < 1;
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={() => !isDisabled && onSend({ text: text.trim() }, true)}
      accessibilityTraits="button">
      <View>
        {children || <Text style={[styles.text, textStyle]}>{label}</Text>}
      </View>
    </TouchableOpacity>
  );
  return <View />;
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
