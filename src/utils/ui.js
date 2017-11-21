// @flow

import { Toast } from 'native-base';

/**
 * Show a Toast/Alert message from Native Base
 * @param {string} message
 * @param {string} type ['warning', 'success', 'danger', '']
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
