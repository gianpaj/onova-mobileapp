// @flow

import { Alert, Linking } from 'react-native';

export const call = (phoneNumber: string): void => {
  Linking.canOpenURL(`tel:${phoneNumber}`)
    .then(supported => {
      return !supported
        ? `We can't open the following phone number 😯: ${phoneNumber}`
        : Linking.openURL(`tel:${phoneNumber}`);
    })
    .catch(err => {
      console.error(err);
      Alert.alert('Something went wrong during the redirection 😯…');
    });
};

export const email = (email: string): void => {
  Linking.canOpenURL(`mailto:${email}`)
    .then(supported => {
      return !supported
        ? Alert.alert(`We can't open the following email 😯: ${email}`)
        : Linking.openURL(`mailto:${email}`);
    })
    .catch(error => {
      console.log(error);
      Alert.alert('Something went wrong during the redirection 😯…');
    });
};
