// @flow

import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';

import ImagePicker, { type Props } from '../../../src/components/ImagePicker';
import imagePickerStyle from '../../../src/components/ImagePicker.styles';

export default function ImagePickerStory(props: Props) {
  return (
    <ImagePicker
      {...props}
      // onImageClick={i => this.selectPhotoTapped(i, false)}
      // onAddImageClick={() => this.selectPhotoTapped(images.length)}
    />
  );
}

ImagePickerStory.defaultProps = {
  files: [],
  onChange() {},
  onFail() {},
  selectable: true,
  styles: StyleSheet.create(imagePickerStyle),
};

ImagePickerStory.propTypes = {
  enabled: PropTypes.bool.isRequired,
  files: PropTypes.array.isRequired,
  onChange: PropTypes.func,
  onChangeOrder: PropTypes.func.isRequired,
  onFail: PropTypes.func,
  selectable: PropTypes.bool,
  styles: PropTypes.any,
};
