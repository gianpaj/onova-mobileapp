// @flow

import { Dimensions } from 'react-native';
import type { ViewStyleProp, TextStyleProp, ImageStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

import colors from '../config/colors';
import variables from './default.native';

const { width } = Dimensions.get('window');

export interface IImagePickerStyle {
  container: ViewStyleProp;
  item: ViewStyleProp;
  image: ImageStyleProp;
  closeWrap: ViewStyleProp;
  closeText: TextStyleProp;
  plusWrap: ViewStyleProp;
  plusWrapNormal: ViewStyleProp;
  plusWrapHighlight: ViewStyleProp;
  plusText: TextStyleProp;
}

export default {
  container: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    height: width / 6,
  },
  item: {
    // marginRight: variables.h_spacing_sm,
    marginBottom: variables.v_spacing_sm,
    overflow: 'hidden',
  },
  image: {
    overflow: 'hidden',
    borderRadius: variables.radius_sm,
  },
  closeWrap: {
    width: 16,
    height: 16,
    backgroundColor: colors.grey3,
    borderRadius: 8,
    position: 'absolute',
    top: 4 + 5,
    right: 4 + 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeText: {
    color: colors.white,
    backgroundColor: colors.transparent,
    fontSize: 20,
    height: 20,
    left: 0.5,
    lineHeight: 20,
    fontWeight: '300',
  },
  plusWrap: {
    alignItems: 'center',
    borderRadius: variables.radius_sm,
    borderWidth: 1,
    justifyContent: 'center',
  },
  plusWrapNormal: {
    backgroundColor: colors.white,
    borderColor: colors.grey3,
  },
  plusWrapHighlight: {
    backgroundColor: colors.grey3,
    borderColor: colors.grey3,
  },
  plusText: {
    backgroundColor: colors.transparent,
    lineHeight: 33,
    fontSize: 32,
    fontWeight: '100',
    color: colors.grey2,
  },
};
