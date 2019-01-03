// @flow

import React from 'react';
import { Title } from 'native-base';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import colors from '../config/colors';

const TitleContainer = (props: any): React$Element<any> => (
  <Title
    style={[styles.style, props.withIcon ? styles.withIcon : {}]}
    {...props}>
    {props.children}
  </Title>
);

const styles = StyleSheet.create({
  style: {
    color: colors.black,
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

export default TitleContainer;
