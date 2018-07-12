// @flow

import React from 'react';

const constants = {
  Aspect: {},
  BarCodeType: {},
  Type: {},
  CaptureMode: {},
  CaptureTarget: {},
  CaptureQuality: {},
  Orientation: {},
  FlashMode: {},
  TorchMode: {},
};

class ImagePicker extends React.Component<*> {
  static constants = constants;

  openPicker() {
    return new Promise((resolve, reject) => {
      resolve({
        path: '',
        width: 999,
        height: 999,
        mime: 'image/jpg',
        size: 9999,
        modificationDate: 1531387247,
      });
    });
  }

  openCamera() {}

  clean() {}

  render() {
    return null;
  }
}

ImagePicker.constants = constants;

export default ImagePicker;
