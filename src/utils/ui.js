// @flow

import { Alert } from 'react-native';
import { Toast } from 'native-base';
global.Intl = require('intl');
require('intl/locale-data/jsonp/ru-UA.js');

import { APP_NAME } from 'react-native-dotenv';

import I18n from '../i18n';

// prettier-ignore
import {
  differenceInHours,
  format,
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
export function showToast(message: string, type: string = '', buttonText?: string, duration: number = 10) {
  if (!buttonText && type == 'success') buttonText = I18n.t('product.toast_warning_ok_button');

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
 * TODO: use promise
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
  onDismiss?: () => void = () => { },
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

export function formatPhoneNumber(value: string): string {
  value = value.replace(/\D/g, '');
  if (value.length > 3)
    value = `(${value.substr(0, 3)}) ${value.substr(3, 3)} ` + `${value.substr(6, 2)} ${value.substr(8)}`;
  return value.trim();
}

export function formatCurrency(value: string, minDecimalPoints: number = 2): string {
  if (!value) return 'n/a';

  return new Intl.NumberFormat('ua-UA', {
    minimumFractionDigits: minDecimalPoints,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sleep(ms: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const category_radio_grp_1_onova = [
  { label: I18n.t('categories.clothes_men'), value: 0 },
  { label: I18n.t('categories.clothes_women'), value: 1 },
  { label: I18n.t('categories.clothes_shoes'), value: 2 },
];

export const category_radio_grp_2 = [
  { label: I18n.t('categories.accessories_jewelry'), value: 10 },
  { label: I18n.t('categories.accessories_bags'), value: 11 },
  { label: I18n.t('categories.accessories_accessories'), value: 12 },
];

export const category_radio_grp_3 = [
  { label: I18n.t('categories.forhome_furniture'), value: 20 },
  { label: I18n.t('categories.forhome_art'), value: 21 },
  { label: I18n.t('categories.forhome_interior'), value: 22 },
];

const category_radio_grp_1_drop = [
  { label: I18n.t('categories.clothes'), value: 0 },
  { label: I18n.t('categories.shoes'), value: 2 },
  { label: I18n.t('categories.other_cat'), value: 12 },
];

export const category_radio_grp_1 = APP_NAME == 'onova' ? category_radio_grp_1_onova : category_radio_grp_1_drop;
