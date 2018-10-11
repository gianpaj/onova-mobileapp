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
function validShippingAddress(s: ShippingAddress) {
  return (
    s.firstName !== '' &&
    s.lastName !== '' &&
    // s.fathersName !== '' && // TODO: is it mandatory?
    s.city !== '' &&
    s.departmentNovaposhta !== ''
  );
}

function isPhoneNumberValid(value: string): boolean {
  if (!value) return false;
  try {
    const number = PhoneUtil.parseAndKeepRawInput(value, 'UA');

    return PhoneUtil.isValidNumberForRegion(number, 'UA');
  } catch (error) {
    return false;
  }
}

export { validPassword, validShippingAddress, isPhoneNumberValid };
