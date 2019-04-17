// @flow

import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../config/colors';

type Props = {
  color?: string,
  onPress: () => void,
};

const Info = (props: Props): React$Element<any> => (
  <Button hitSlop={{ top: 0, left: 15, bottom: 0, right: 20 }} onPress={props.onPress} style={styles.info} transparent>
    <MaterialCommunityIcons color={props.color} name="information-outline" size={18} />
  </Button>
);

Info.defaultProps = {
  color: colors.red,
};

const styles = StyleSheet.create({
  info: {
    marginTop: 5,
  },
});

export default Info;
