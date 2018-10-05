// @flow

import { Alert } from 'react-native';
import { Toast } from 'native-base';
import I18n from '../i18n';

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
 * @param buttonText text for the button to dismiss the Toast ('OK' default for both EN and UK)
 * @param duration seconds (default is 10)
 */
export function showToast(
  message: string,
  type: string = '',
  buttonText?: string,
  duration: number = 10
) {
  if (!buttonText && type == 'success')
    buttonText = I18n.t('product.toast_warning_ok_button');
  Toast.show({
    text: message,
    type: type,
    duration: duration * 1000,
    position: 'top',
    textStyle: { textAlign: 'center' },
    buttonText,
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
  onContinue: () => void | Promise<any>,
  onDismiss?: () => void = () => {},
  cancelText: string = I18n.t('alerts.confirm_alert_button_cancel'),
  confirmText: string = I18n.t('alerts.confirm_alert_button_confirm')
) {
  return Alert.alert(title, message, [
    { text: cancelText, onPress: onDismiss, style: 'cancel' },
    { text: confirmText, onPress: onContinue },
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

export const category_radio_grp_1 = [
  { label: I18n.t('categories.clothes'), value: 0 },
  { label: I18n.t('categories.shoes'), value: 1 },
  { label: I18n.t('categories.other_cat'), value: 2 },
];

export const category_radio_grp_2 = [
  { label: I18n.t('categories.men'), value: 0 },
  { label: I18n.t('categories.women'), value: 1 },
  { label: I18n.t('categories.other_type'), value: 2 },
];
