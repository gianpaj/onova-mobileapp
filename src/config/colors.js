// @flow

/**
 * providesModule HSColors
 */

export default {
  primary: '#000000',
  active: '#008aff',
  bgDefault: '#ffffff',
  pLight: '#666ad1',
  pDark: '#001970',
  secondary: '#ffb74d',
  sLight: '#ffe97d',
  yellow: 'yellow',
  sDark: '#c88719',
  grey1: '#43484d',
  grey2: '#5e6977',
  grey3: '#86939e',
  grey4: '#bdc6cf',
  grey5: '#eeeeee',
  grey6: '#f9f9f9',
  dkGreyBg: '#232323',
  greyOutline: '#cbd2d9',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  transparent: 'transparent',
};

/**
 * convert HEX to RGBA and add alpha from opacity (0 - 100)
 */
export function convertHex(hex: string, opacity: number): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
}
