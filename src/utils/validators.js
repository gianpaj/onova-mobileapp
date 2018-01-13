// @flow
import type { ShippingInfo } from '../types';

function validPassword(password: string) {
  return password.length > 7 && password.length < 51;
}

/**
 * If any of the fields is not empty
 */
function validShippingAddress(stateShippingInfo: ShippingInfo) {
  return (
    stateShippingInfo.line1 !== '' ||
    stateShippingInfo.line2 !== '' ||
    stateShippingInfo.city !== '' ||
    stateShippingInfo.state !== ''
  );
}

export { validPassword, validShippingAddress };
