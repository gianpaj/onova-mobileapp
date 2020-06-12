// @flow
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Loader(): React$Element<any> {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
});
