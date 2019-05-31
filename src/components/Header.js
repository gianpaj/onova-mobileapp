// @flow

import React from 'react';
import { StyleSheet } from 'react-native';
import { Header } from 'native-base';
import colors from '../config/colors';

const HeaderContainer = (props: any): React$Element<any> => (
  <Header
    androidStatusBarColor={colors.primary}
    style={[styles.style, { backgroundColor: colors.bgDefault }]}
    {...props}
  />
);

const styles = StyleSheet.create({
  style: {
    paddingLeft: 10,
    paddingRight: 10,
  },
});

export default React.memo(HeaderContainer);
