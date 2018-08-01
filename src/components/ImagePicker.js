// @flow

// from https://github.com/ant-design/ant-design-mobile-rn/blob/7715f25a77557ac41f5e2e5889a73dfb4c47b66c/components/image-picker/index.native.tsx

import React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
// import ImageRoll from './ImageRoll.native';
import imagePickerStyle, { IImagePickerStyle } from './ImagePicker.styles';
import SortableList from 'react-native-sortable-list';
import colors from '../config/colors';

const window = Dimensions.get('window');

export type Props = {
  // style?: {},
  files?: Array<{}>,
  onChange?: (files: Array<{}>, operationType: string, index?: number) => void,
  onImageClick?: (index?: number, files?: Array<{}>) => void,
  onAddImageClick?: () => void,
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

const imagePickerStyles = StyleSheet.create(imagePickerStyle);

export default class ImagePicker extends React.Component<Props, State> {
  state = {
    visible: false,
  };

  static defaultProps = {
    styles: imagePickerStyles,
    onChange() {},
    onFail() {},
    files: [],
    selectable: true,
  };

  plusText: any;
  plusWrap: any;

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

  removeImage = (idx: number): void => {
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
    if (this.props.onImageClick) {
      this.props.onImageClick(index, this.props.files);
    }
  }

  render() {
    const { files = [], selectable, enabled, styles } = this.props;
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
      <View style={localStyles.container}>
        {/* {filesView} */}
        <SortableList
          horizontal
          style={localStyles.list}
          contentContainerStyle={localStyles.contentContainer}
          data={files}
          renderRow={this._renderRow}
          sortingEnabled={enabled}
          scrollEnabled={enabled}
          // onActivateRow={activatedRow => this.setState({ activatedRow })}
          onPressRow={index => this.onImageClick(index)}
          onChangeOrder={nextOrder => console.log(nextOrder)}
        />
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

  _renderRow = ({ data, active, index }) => {
    return (
      <Row
        active={active}
        data={data}
        index={index}
        removeImage={() => this.removeImage(index)}
        styles={this.props.styles}
      />
    );
  };
}

type Props2 = {
  active: boolean,
  data: {
    url: string,
  },
  // key: number,
  removeImage: () => void,
  styles: IImagePickerStyle,
};

class Row extends React.Component<Props2> {
  _active = new Animated.Value(0);
  _style;

  constructor(props) {
    super(props);

    this._style = {
      ...Platform.select({
        ios: {
          transform: [
            {
              scale: this._active.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              }),
            },
          ],
          shadowRadius: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 10],
          }),
        },

        android: {
          transform: [
            {
              scale: this._active.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.07],
              }),
            },
          ],
          elevation: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 6],
          }),
        },
      }),
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
      <Animated.View style={[styles.item, styles.size]}>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
    }),
  },

  list: {
    height: 50,
    // width: window.width,
  },

  contentContainer: {
    paddingVertical: Platform.select({
      // ios: 30,
      android: 0,
    }),
  },

  row: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 5,
    width: 50,
    height: 10,
    marginHorizontal: 10,
    borderRadius: 4,
  },

  image: {
    width: 50,
    height: 50,
    marginBottom: 15,
  },

  text: {
    fontSize: 18,
    color: '#222222',
  },
});
