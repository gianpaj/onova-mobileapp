// @flow

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/Feather';

// import I18n from '../i18n';
import colors from '../config/colors';

const PICKER_OPTIONS = {
  compressImageMaxWidth: 1440,
  compressImageMaxHeight: 1440,
  compressImageQuality: 0.7,
  cropping: false,
  mediaType: 'photo',
  // cropper_toolbar_title: I18n.t('add_or_edit_item.cropper_toolbar_title'),
};

type State = {
  isCameraOpened: boolean,
};

type Props = {
  onSend: (any: any) => void,
  uploadingImage: boolean,
};

export default class ChatActions extends React.PureComponent<Props, State> {
  /*onActionsPress = () => {
    // const options = ['Choose From Library', 'Send Location', 'Cancel'];
    const options = ['Choose From Library', 'Cancel'];
    const cancelButtonIndex = 1;
    this.context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            this.pickImage();
            break;
          // case 1:
          //   navigator.geolocation.getCurrentPosition(
          //     position => {
          //       this.props.onSend({
          //         location: {
          //           latitude: position.coords.latitude,
          //           longitude: position.coords.longitude,
          //         },
          //       });
          //     },
          //     error => alert(error.message),
          //     { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          //   );
          //   break;
          default:
        }
      }
    );
  };
  */
  state = {
    isCameraOpened: false,
  };

  pickImage = () => {
    // prevent pressing multiple times on the image
    if (this.state.isCameraOpened) return;

    this.setState({ isCameraOpened: true });

    let imagePickerPromise;
    if (__DEV__ && Platform.OS === 'ios') {
      imagePickerPromise = ImagePicker.openPicker({
        ...PICKER_OPTIONS,
      });
    } else {
      imagePickerPromise = ImagePicker.openCamera({
        ...PICKER_OPTIONS,
      });
    }
    imagePickerPromise
      .then(res =>
        this.props.onSend({
          uri: res.path,
          image: res.path,
          name: res.filename, // undefined on Android
          type: res.mime,
        })
      )
      .catch(e => {
        if (e.code !== 'E_PICKER_CANCELLED') {
          console.error(e);
        }
      })
      .then(() => this.setState({ isCameraOpened: false }));
  };

  render() {
    if (this.props.uploadingImage)
      return <ActivityIndicator style={styles.container} size="small" />;

    return (
      <TouchableOpacity style={styles.container}>
        <Icon
          name="camera"
          size={22}
          onPress={this.pickImage}
          color={colors.grey3}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    marginLeft: 10,
    marginBottom: 5,
    top: -5,
  },
});
