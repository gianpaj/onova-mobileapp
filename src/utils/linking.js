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
      Alert.alert(`Something went wrong opening this telephone link 😯: ${phoneNumber}`);
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
      console.error(err);
      Alert.alert(`Something went wrong opening this mailto link 😯: ${email}`);
    });
};

export const openURL = (url: string): void => {
  let fullURL = url;
  // Prepending http:// to a URL that doesn't already contain http://
  if (!/^https?:\/\//i.test(url)) {
    fullURL = 'http://' + url;
  }
  Linking.canOpenURL(fullURL)
    .then(supported => {
      if (supported) return Linking.openURL(fullURL);
      Alert.alert(`😯\nWe can't open:\n${fullURL}`);
    })
    .catch(err => {
      console.error(err);
      Alert.alert(`😯\nSomething went wrong opening:\n${fullURL}`);
    });
};

export const URLpattern = /(https?:\/\/|www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*[-a-zA-Z0-9@:%_\+~#?&\/=])*/i;
