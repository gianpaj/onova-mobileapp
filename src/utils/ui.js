// @flow

import { Alert } from 'react-native';
import { Toast } from 'native-base';
// prettier-ignore
import {
  format,
  differenceInHours,
  isYesterday,
} from 'date-fns';

/**
 * Show a Toast/Alert message from Native Base
 *
 * @param message
 * @param type ['warning', 'success', 'danger', '']
 */
export function showToast(message: string, type: string = '') {
  Toast.show({
    text: message,
    type: type,
    duration: 2000,
    position: 'top',
    textStyle: { textAlign: 'center' },
  });
}

/**
 * Show React Native Alert
 *
 * @param title
 * @param message
 * @param onContinue
 * @param onDismiss
 */
export function showConfirmAlert(
  title: string,
  message: string,
  onContinue: () => void,
  onDismiss?: () => void = () => {}
) {
  return Alert.alert(title, message, [
    { text: 'No', onPress: onDismiss, style: 'cancel' },
    { text: 'Yes', onPress: onContinue },
  ]);
}

/**
 * formatTime
 *
 * @param {Date} createdAt
 */
export function formatTime(createdAt: Date): string {
  if (isYesterday(createdAt)) {
    return '1d';
  }
  if (differenceInHours(new Date(), createdAt) < 24) {
    return format(createdAt, 'HH:mm');
  }
  return format(createdAt, 'D MMM');
}

export const isProd =
  JSON.parse(JSON.stringify(process.env)).NODE_ENV == 'prod';

console.debug('isProd', isProd);

let API_URL_;

API_URL_ = 'http://localhost:4040';

if (isProd) {
  API_URL_ = 'https://onova-183307.appspot.com';
}

export const API_URL = API_URL_;
