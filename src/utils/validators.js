// @flow

import type { ShippingAddress } from '../types';

function validPassword(password: string) {
  return password.length > 7 && password.length < 51;
}

/**
 * If any of the fields is not empty
 */
function validShippingAddress(stateShippingInfo: ShippingAddress) {
  return (
    stateShippingInfo.line1 !== '' ||
    stateShippingInfo.line2 !== '' ||
    stateShippingInfo.city !== '' ||
    stateShippingInfo.state !== ''
  );
}

export { validPassword, validShippingAddress };
