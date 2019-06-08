// @flow

// originally from https://github.com/ant-design/ant-design-mobile-rn/blob/0544f09b0843bb0fae6c353f07056d16f4538cd9/components/image-picker/index.tsx

import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import imagePickerStyle from './ImagePicker.styles';
import SortableList from 'react-native-sortable-list';

import colors from '../config/colors';

export type Props = {
  enabled: boolean,
  files: Array<any>,
  onAddImageClick?: () => void,
  onChange?: (files: Array<any>, operationType?: string, index?: number) => void,
  onChangeOrder: (Array<any>) => void,
  onImageClick?: (index?: number, files?: Array<any>) => void,
  selectable?: boolean,
  imagePerRow: number,
};

type State = {
  visible: boolean,
};

const { width } = Dimensions.get('window');

let square;
const imageMargin = 5;

const widthOfContainer = width - 16 * 2;

export default class ImagePicker extends React.Component<Props, State> {
  arr: Array<any>;

  state = {
    visible: false,
  };

  static defaultProps = {
    selectable: true,
    enabled: true,
  };

  constructor(props: Props) {
    super(props);
    const size = widthOfContainer / this.props.imagePerRow - imageMargin * 2;

    square = {
      width: size,
      height: size,
    };
  }

  showPicker = () => {
    if (this.props.onAddImageClick) return this.props.onAddImageClick();

    this.setState({ visible: true });
  };

  addImage(imageObj: any) {
    const { files = [], onChange } = this.props;
    if (!imageObj.url) {
      imageObj.url = imageObj.uri;
      delete imageObj.uri;
    }
    const newImages = files.concat(imageObj);
    if (onChange) onChange(newImages, 'add');
  }

  removeImage = (idx: number): void => {
    const { files, onChange } = this.props;
    const copy = [...files];
    copy.splice(idx, 1);
    if (onChange) onChange(copy);
  };

  onImageClick = (index: number) => {
    const { onImageClick } = this.props;
    if (onImageClick) onImageClick(index);
  };

  render() {
    const { files, selectable, enabled, onChangeOrder } = this.props;

    return (
      <View style={styles.container}>
        <SortableList
          data={files}
          horizontal
          onPressRow={this.onImageClick}
          onReleaseRow={onChangeOrder}
          renderRow={this._renderRow}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          sortingEnabled={enabled}
        />
        {selectable && (
          <TouchableOpacity
            onPress={this.showPicker}
            style={[
              styles.item,
              square,
              { marginLeft: imageMargin - 1, marginVertical: imageMargin - 1 },
              styles.plusWrap,
              styles.plusWrapNormal,
            ]}>
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  _renderRow = ({ data, active, index }) => (
    <Row
      active={active}
      data={data}
      index={index}
      imagePerRow={this.props.imagePerRow}
      removeImage={() => this.props.enabled && this.removeImage(index)}
    />
  );
}

type RowProps = {
  active: boolean,
  data: {
    url: string,
    isUploading: boolean,
  },
  removeImage: () => any,
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
    const { data, removeImage } = this.props;

    const style = [square, styles.image, { margin: imageMargin - 1 }];

    return (
      <Animated.View style={[styles.row, this._style]}>
        {data.isUploading ? (
          <ActivityIndicator size="small" style={[...style, styles.loader]} />
        ) : (
          <>
            <Image source={{ uri: data.url.replace('.jpg', '-thumb.jpg') }} style={style} />
            <TouchableOpacity onPress={removeImage} style={styles.closeWrap} activeOpacity={0.6}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  ...imagePickerStyle,
  image: {
    ...imagePickerStyle.image,
    margin: imageMargin,
  },
  loader: {
    borderColor: colors.grey5,
    borderWidth: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'column',
  },
});
