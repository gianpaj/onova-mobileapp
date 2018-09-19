// @flow

import { Dimensions, ViewStyle, ImageStyle, TextStyle } from 'react-native';

import colors from '../config/colors';
import variables from './default.native';

const { width } = Dimensions.get('window');

export interface IImagePickerStyle {
  container: ViewStyle;
  size: ViewStyle;
  item: ViewStyle;
  image: ImageStyle;
  closeWrap: ViewStyle;
  closeText: TextStyle;
  plusWrap: ViewStyle;
  plusWrapNormal: ViewStyle;
  plusWrapHighlight: ViewStyle;
  plusText: TextStyle;
}

export default {
  container: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    height: width / 6,
  },
  size: {
    width: width / 6 - 12,
    height: width / 6 - 12,
    margin: 5,
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
    marginTop: -8,
    fontWeight: '300',
  },
  plusWrap: {
    borderRadius: variables.radius_sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 32,
    backgroundColor: colors.transparent,
    fontWeight: '100',
    color: colors.grey2,
  },
};
