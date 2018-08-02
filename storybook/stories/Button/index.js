// @flow

import React from 'react';
import PropTypes from 'prop-types';
import { Button as NBButton } from 'native-base';

export default function Button(props) {
  return <NBButton {...props}>{props.children}</NBButton>;
}

Button.defaultProps = {
  children: null,
  block: false,
  onPress: () => {},
};

Button.propTypes = {
  children: PropTypes.node,
  style: PropTypes.any,
  onPress: PropTypes.func,
};
