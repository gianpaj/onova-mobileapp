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
      console.log(err);
      Alert.alert(
        `Something went wrong opening this telephone link 😯: ${phoneNumber}`
      );
    });
};

export const email = (email: string): void => {
  Linking.canOpenURL(`mailto:${email}`)
    .then(supported => {
      return !supported
        ? Alert.alert(`We can't open the following email 😯: ${email}`)
        : Linking.openURL(`mailto:${email}`);
    })
    .catch(err => {
      console.log(err);
      Alert.alert(`Something went wrong opening this mailto link 😯: ${email}`);
    });
};

export const openURL = (url: string): void => {
  Linking.canOpenURL(url)
    .then(supported => {
      return !supported
        ? Alert.alert(`We can't open the following url 😯: ${url}`)
        : Linking.openURL(url);
    })
    .catch(err => {
      console.log(err);
      Alert.alert(`Something went wrong opening this url 😯: ${url}`);
    });
};
