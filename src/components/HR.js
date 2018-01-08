import React from 'react';
import { StyleSheet, View } from 'react-native';
import colors from '../config/colors';

const HR = () => <View style={styles.hr} />;

const styles = StyleSheet.create({
  hr: {
    alignSelf: 'center',
    borderTopWidth: 1,
    borderColor: colors.grey4,
    margin: 10,
    width: '89.5%',
  },
});

export default HR;
