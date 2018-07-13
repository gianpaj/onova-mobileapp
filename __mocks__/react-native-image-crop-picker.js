// @flow

class ImagePicker {
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

export default new ImagePicker();
