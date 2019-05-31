// @flow

import React from 'react';
import { StyleSheet } from 'react-native';
import { Title } from 'native-base';
import PropTypes from 'prop-types';

import colors from '../config/colors';

const TitleContainer = (props: any): React$Element<any> => (
  <Title style={[styles.style, props.withIcon ? styles.withIcon : {}]} {...props}>
    {props.children}
  </Title>
);

const styles = StyleSheet.create({
  style: {
    color: colors.black,
    paddingLeft: 0,
  },
  withIcon: {
    // marginLeft: 22,
    marginRight: 5,
  },
});

TitleContainer.propTypes = {
  withIcon: PropTypes.bool,
};

TitleContainer.defaultProps = {
  withIcon: false,
};

export default React.memo(TitleContainer);
