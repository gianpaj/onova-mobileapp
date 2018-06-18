/* eslint no-use-before-define: ["error", { "variables": false }] */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Image,
  StyleSheet,
  View,
  ViewPropTypes,
  TouchableWithoutFeedback,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

class MessageImage extends React.Component<Props> {
  state = {
    isModalVisible: false,
  };

  render() {
    return (
      <View style={this.props.containerStyle}>
        <TouchableWithoutFeedback
          onPress={() => this.setState({ isModalVisible: true })}>
          <Image
            {...this.props.imageProps}
            style={[styles.image, this.props.imageStyle]}
            source={{ uri: this.props.currentMessage.image }}
          />
        </TouchableWithoutFeedback>
        <Modal
          animationType="fade"
          // hardwareAccelerated={true} // android
          visible={this.state.isModalVisible}
          transparent={false}
          onRequestClose={() => this.setState({ isModalVisible: false })}>
          <ImageViewer
            renderIndicator={() => null}
            onCancel={() => this.setState({ isModalVisible: false })}
            imageUrls={[{ url: this.props.currentMessage.image }]}
          />
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

MessageImage.defaultProps = {
  currentMessage: {
    image: null,
  },
  containerStyle: {},
  imageStyle: {},
  imageProps: {},
  lightboxProps: {},
};

MessageImage.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: ViewPropTypes.style,
  imageStyle: Image.propTypes.style,
  imageProps: PropTypes.object,
  lightboxProps: PropTypes.object,
};
