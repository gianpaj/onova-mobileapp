// @flow

export type PaymentResponse = {
  // if demo using a virtual card, and ??
  type?: 'LOOKUP',

  // 3ds secure
  PaReq?: string,
  url?: string,
  redirectUrl: string,
};
