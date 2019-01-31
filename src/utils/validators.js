// @flow
import libphonenumber from 'google-libphonenumber';
const PhoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

import type { City, Department, ShippingAddress } from '../types';

function validPassword(password: string) {
  return password.length > 7 && password.length < 51;
}

/**
 * If any of the fields is not empty
 * TODO: determine business logic.
 */
function validShippingAddress(
  s: ShippingAddress,
  cities: Array<City>,
  departments: Array<Department>
) {
  return (
    s.firstName !== '' &&
    s.lastName !== '' &&
    cities &&
    cities.find(city => city.id === s.city) &&
    departments &&
    departments.find(d => d.id === s.departmentNovaposhta)
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
