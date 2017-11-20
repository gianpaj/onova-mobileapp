// @flow

import React from 'react';
import { Toast } from 'native-base';

/**
 * Show a Toast/Alert message from Native Base
 * @param {string} message
 */
export function showToast(message: string) {
  Toast.show({
    text: message,
    duration: 2000,
    position: "top",
    textStyle: { textAlign: "center" },
  });
}
