// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  View,
  ImageStyle,
  StyleProp,
  ViewStyle,
  ViewPropTypes,
} from 'react-native';
import Modal from 'react-native-modal';
import ImageZoom from 'react-native-image-pan-zoom';

import colors from '../config/colors';

const { width, height } = Dimensions.get('window');

type State = {
  fetchedLink: string,
  isModalVisible: boolean,
  imageHeight: number,
};

type Props = {
  currentMessage: {
    image: string,
  },
  containerStyle: StyleProp<ViewStyle>,
  imageStyle: StyleProp<ImageStyle>,
  imageProps: Image.propTypes.style,
  lightboxProps: any,
};

export default class MessageImage extends React.Component<Props, State> {
  state = {
    fetchedLink: '',
    isModalVisible: false,
    imageHeight: 0,
  };

  static defaultProps = {
    currentMessage: {
      image: null,
    },
    containerStyle: {},
    imageStyle: {},
    imageProps: {},
    lightboxProps: {},
  };

  componentDidMount() {
    console.warn(this.props.currentMessage);
    const { image } = this.props.currentMessage;
    Image.getSize(image.link, (w, h) => {
      this.setState({ imageHeight: Math.floor(h * (width / w)) });
    });
  }

  _toggleModal = () => this.setState({ isModalVisible: !this.state.isModalVisible });

  render() {
    const { fetchedLink, isModalVisible, imageHeight } = this.state;
    const { currentMessage, imageStyle, containerStyle, imageProps } = this.props;
    let uri = currentMessage.image.link;

    if (currentMessage.image.fetchRequired && fetchedLink !== '') {
      uri = fetchedLink;
    }
    return (
      <View style={containerStyle}>
        <TouchableWithoutFeedback onPress={this._toggleModal}>
          <Image {...imageProps} style={[styles.image, imageStyle]} source={{ uri }} />
        </TouchableWithoutFeedback>
        <Modal
          backdropOpacity={1}
          isVisible={isModalVisible}
          onBackButtonPress={this._toggleModal}
          onBackdropPress={this._toggleModal}
          onSwipe={this._toggleModal}
          style={[Platform.OS === 'ios' ? { left: -19 } : {}]}
          swipeDirection="down">
          <ImageZoom
            cropWidth={width}
            cropHeight={height}
            enableSwipeDown
            onSwipeDown={this._toggleModal}
            imageWidth={width}
            imageHeight={imageHeight}
            style={{ backgroundColor: colors.black }}>
            <Image
              style={{
                width,
                height: imageHeight,
              }}
              resizeMode="contain"
              source={{ uri: uri.replace('thumb', '') }}
            />
          </ImageZoom>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 13,
    height: 100,
    margin: 3,
    width: 150,
  },
});

MessageImage.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: ViewPropTypes.style,
  imageStyle: Image.propTypes.style,
  imageProps: PropTypes.object,
};
