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
  ViewPropTypes,
} from 'react-native';
import Modal from 'react-native-modal';
import ImageZoom from 'react-native-image-pan-zoom';

import { currentUser } from '../actions/actionCreator';
import colors from '../config/colors';

const { width, height } = Dimensions.get('window');

type State = {
  fetchedLink: string,
  isModalVisible: boolean,
  imageHeight: number,
};

class MessageImage extends React.Component<*, State> {
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

  async componentDidMount() {
    const { image } = this.props.currentMessage;
    if (image.fetchRequired && currentUser) {
      const fetched = await currentUser.fetchAttachment({ url: image.link });
      this.setState({ fetchedLink: fetched.link });
      Image.getSize(fetched.link, (w, h) => {
        this.setState({ imageHeight: Math.floor(h * (width / w)) });
      });
    } else {
      Image.getSize(image.link, (w, h) => {
        this.setState({ imageHeight: Math.floor(h * (width / w)) });
      });
    }
  }

  _toggleModal = () =>
    this.setState({ isModalVisible: !this.state.isModalVisible });

  render() {
    const { image } = this.props.currentMessage;
    const { fetchedLink, isModalVisible, imageHeight } = this.state;
    let uri = image.link;

    if (image.fetchRequired && fetchedLink !== '') {
      uri = fetchedLink;
    }
    return (
      <View style={this.props.containerStyle}>
        <TouchableWithoutFeedback onPress={this._toggleModal}>
          <Image
            {...this.props.imageProps}
            style={[styles.image, this.props.imageStyle]}
            source={{ uri }}
          />
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

export default MessageImage;

const styles = StyleSheet.create({
  image: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 3,
  },
});

MessageImage.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: ViewPropTypes.style,
  imageStyle: Image.propTypes.style,
  imageProps: PropTypes.object,
};
