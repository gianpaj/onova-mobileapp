import React from 'react';
import { StyleSheet, View } from 'react-native';
import colors from '../config/colors';

const HR = props => (
  <View style={[styles.hr, { width: `${props.full ? '100%' : '89.5%'}` }]} />
);

const styles = StyleSheet.create({
  hr: {
    alignSelf: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey4,
    marginVertical: 10,
  },
});

export default HR;
