import React from 'react';
import PropTypes from 'prop-types';
import { Icon as NBIcon } from 'native-base';

import colors from '../config/colors';

const Icon = props => (
  <NBIcon style={{ ...props.style, color: props.color }} name={props.name} ios={props.ios} android={props.android} />
);

Icon.defaultProps = {
  color: colors.black,
};

Icon.propTypes = {
  android: PropTypes.string,
  name: PropTypes.string,
  ios: PropTypes.string,
  color: PropTypes.string,
  style: PropTypes.any,
};

export default Icon;
