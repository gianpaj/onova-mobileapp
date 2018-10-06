// @flow
import libphonenumber from 'google-libphonenumber';
const PhoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

import type { ShippingAddress } from '../types';

function validPassword(password: string) {
  return password.length > 7 && password.length < 51;
}

/**
 * If any of the fields is not empty
 * TODO: determine business logic.
 */
function validShippingAddress(stateShippingInfo: ShippingAddress) {
  return (
    stateShippingInfo.line1 !== '' ||
    stateShippingInfo.line2 !== '' ||
    stateShippingInfo.city !== '' ||
    stateShippingInfo.state !== ''
  );
}

function isPhoneNumberValid(value: string): boolean {
  if (!value) return;
  try {
    const number = PhoneUtil.parseAndKeepRawInput(value, 'UA');

    return PhoneUtil.isValidNumberForRegion(number, 'UA');
  } catch (error) {
    return false;
  }
}

export { validPassword, validShippingAddress, isPhoneNumberValid };
