// @flow

// from https://github.com/ant-design/ant-design-mobile-rn/blob/7715f25a77557ac41f5e2e5889a73dfb4c47b66c/components/image-picker/index.native.tsx

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
// import ImageRoll from './ImageRoll.native';
import imagePickerStyle, { IImagePickerStyle } from './ImagePicker.styles';

export type ImagePickerPropTypes = {
  // style?: {},
  files?: Array<{}>,
  onChange?: (files: Array<{}>, operationType: string, index?: number) => void,
  onImageClick?: (index?: number, files?: Array<{}>) => void,
  onAddImageClick?: () => void,
  // onFail?: (msg: string) => void,
  selectable?: boolean,
  // multiple?: boolean, // UNUSED
  // accept?: string, // UNUSED

  // export interface ImagePickerNativeProps extends ImagePickerPropTypes
  styles: IImagePickerStyle,
};

const imagePickerStyles = StyleSheet.create(imagePickerStyle);

export default class ImagePicker extends React.Component<
  ImagePickerPropTypes,
  any
> {
  static defaultProps = {
    styles: imagePickerStyles,
    onChange() {},
    onFail() {},
    files: [],
    selectable: true,
  };

  plusText: any;
  plusWrap: any;

  constructor(props: ImagePickerPropTypes) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  onPressIn = () => {
    const styles = this.props.styles;
    this.plusWrap.setNativeProps({
      style: [styles.item, styles.size, styles.plusWrapHighlight],
    });
  };

  onPressOut = () => {
    const styles = this.props.styles;
    this.plusWrap.setNativeProps({
      style: [styles.item, styles.size, styles.plusWrapNormal],
    });
  };

  showPicker = () => {
    if (this.props.onAddImageClick) {
      this.props.onAddImageClick();
      return;
    }
    this.setState({
      visible: true,
    });
  };

  addImage(imageObj: any) {
    if (!imageObj.url) {
      imageObj.url = imageObj.uri;
      delete imageObj.uri;
    }
    const { files = [] } = this.props;
    const newImages = files.concat(imageObj);
    if (this.props.onChange) {
      this.props.onChange(newImages, 'add');
    }
  }

  removeImage(idx: number): void {
    const newImages: any[] = [];
    const { files = [] } = this.props;
    files.forEach((image, index) => {
      if (index !== idx) {
        newImages.push(image);
      }
    });
    if (this.props.onChange) {
      this.props.onChange(newImages, 'remove', idx);
    }
  }

  // hideImageRoll = () => {
  //   this.setState({
  //     visible: false,
  //   });
  //   if (this.props.onFail) {
  //     this.props.onFail('cancel image selection');
  //   }
  // };

  onImageClick(index: number) {
    if (this.props.onImageClick) {
      this.props.onImageClick(index, this.props.files);
    }
  }

  render() {
    const { files = [], selectable } = this.props;
    const styles = this.props.styles;
    const filesView = files.map((item: any, index) => (
      <View key={index} style={[styles.item, styles.size]}>
        <TouchableOpacity
          onPress={() => this.onImageClick(index)}
          activeOpacity={0.6}>
          <Image
            source={{ uri: item.url }}
            style={[styles.size, styles.image]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.removeImage(index)}
          style={styles.closeWrap}
          activeOpacity={0.6}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
    ));

    // const imageRollEl = (
    //   <ImageRoll
    //     onCancel={this.hideImageRoll}
    //     onSelected={imgObj => this.addImage(imgObj)}
    //   />
    // );
    return (
      <View style={styles.container}>
        {filesView}
        {selectable && (
          <TouchableWithoutFeedback
            onPress={this.showPicker}
            onPressIn={this.onPressIn}
            onPressOut={this.onPressOut}>
            <View
              ref={conponent => (this.plusWrap = conponent)}
              style={[
                styles.item,
                styles.size,
                styles.plusWrap,
                styles.plusWrapNormal,
              ]}>
              <Text style={[styles.plusText]}>+</Text>
            </View>
          </TouchableWithoutFeedback>
        )}
        {/* {this.state.visible ? imageRollEl : null} */}
      </View>
    );
  }
}
