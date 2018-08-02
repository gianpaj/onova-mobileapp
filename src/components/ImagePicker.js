// @flow

// originally from https://github.com/ant-design/ant-design-mobile-rn/blob/7715f25a77557ac41f5e2e5889a73dfb4c47b66c/components/image-picker/index.native.tsx

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import imagePickerStyle, { IImagePickerStyle } from './ImagePicker.styles';
import SortableList from 'react-native-sortable-list';

export type Props = {
  // style?: {}, // UNUSED
  files: Array<{}>,
  onChange: (files: Array<{}>, operationType?: string, index?: number) => void,
  onImageClick?: (index?: number, files?: Array<{}>) => void,
  onAddImageClick?: () => void,
  onChangeOrder: (Array<{}>) => void,
  // onFail?: (msg: string) => void,
  selectable?: boolean,
  enabled: boolean,
  // multiple?: boolean, // UNUSED
  // accept?: string, // UNUSED

  // export interface ImagePickerNativeProps extends Props
  styles: IImagePickerStyle,
};

type State = {
  visible: boolean,
};

export default class ImagePicker extends React.Component<Props, State> {
  state = {
    visible: false,
  };

  static defaultProps = {
    styles: StyleSheet.create(imagePickerStyle),
    onChange() {},
    onFail() {},
    files: [],
    selectable: true,
  };

  // plusWrap: any;

  /*
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
  };*/

  showPicker = () => {
    if (this.props.onAddImageClick) return this.props.onAddImageClick();

    this.setState({ visible: true });
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

  removeImage = (idx: number): void => {
    const { files, onChange } = this.props;
    const copy = [...files];
    copy.splice(idx, 1);
    if (onChange) onChange(copy);
  };

  // hideImageRoll = () => {
  //   this.setState({
  //     visible: false,
  //   });
  //   if (this.props.onFail) {
  //     this.props.onFail('cancel image selection');
  //   }
  // };

  onImageClick(index: number) {
    const { onImageClick, files } = this.props;
    if (onImageClick) onImageClick(index, files);
  }

  render() {
    const { files, selectable, enabled, styles, onChangeOrder } = this.props;
    /*
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
    ));*/

    return (
      <View style={styles.container}>
        {/* {filesView} */}
        <SortableList
          horizontal
          data={files}
          renderRow={this._renderRow}
          sortingEnabled={enabled}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          onPressRow={index => this.onImageClick(index)}
          onChangeOrder={onChangeOrder}
        />
        {selectable && (
          <TouchableWithoutFeedback
            onPress={this.showPicker}
            onPressIn={this.onPressIn}
            onPressOut={this.onPressOut}>
            <View
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
      </View>
    );
  }

  _renderRow = ({ data, active, index }) => {
    return (
      <Row
        active={active}
        data={data}
        index={index}
        removeImage={() => {
          if (this.props.enabled) this.removeImage(index);
        }}
        styles={this.props.styles}
      />
    );
  };
}

type RowProps = {
  active: boolean,
  data: {
    url: string,
    isUploading: boolean,
  },
  removeImage: () => void,
  styles: IImagePickerStyle,
};

class Row extends React.Component<RowProps> {
  _active = new Animated.Value(0);
  _style;

  constructor(props) {
    super(props);

    this._style = {
      transform: [
        {
          scale: Platform.select({
            ios: this._active.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.1],
            }),

            android: this._active.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.07],
            }),
          }),
        },
      ],
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.active !== nextProps.active) {
      Animated.timing(this._active, {
        duration: 300,
        easing: Easing.bounce,
        toValue: Number(nextProps.active),
      }).start();
    }
  }

  render() {
    const { data, styles, removeImage } = this.props;

    return (
      <Animated.View style={[localStyles.row, this._style]}>
        <Image source={{ uri: data.url }} style={[styles.size, styles.image]} />
        <TouchableOpacity
          onPress={removeImage}
          style={styles.closeWrap}
          activeOpacity={0.6}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
}

const localStyles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    alignItems: 'center',
    // paddingHorizontal: 5,
    // marginHorizontal: 4,
    borderRadius: 4,
  },
});
