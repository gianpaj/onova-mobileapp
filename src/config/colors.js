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
  yellow: '#fff000',
  sDark: '#c88719',
  grey1: '#515151',
  grey2: '#767676',
  grey3: '#9f9f9f',
  grey4: '#d0d0d0',
  grey5: '#eeeeee',
  grey6: '#f9f9f9',
  dkGreyBg: '#232323',
  greyOutline: '#d8d8d8',
  black: '#000000',
  white: '#ffffff',
  red: '#ff001e',
  green: '#00ff55',
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
