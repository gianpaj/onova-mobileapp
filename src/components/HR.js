// @flow

import React from 'react';
import { StyleSheet, View } from 'react-native';

import colors from '../config/colors';

type Props = {
  full: boolean,
  color?: string,
};

const HR = (props: Props): React$Element<any> => (
  <View
    style={[styles.hr, props.color && { borderColor: props.color }, { width: `${props.full ? '100%' : '89.5%'}` }]}
  />
);

HR.defaultProps = {
  full: false,
};

const styles = StyleSheet.create({
  hr: {
    alignSelf: 'center',
    borderColor: colors.grey4,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
});

export default React.memo(HR);
