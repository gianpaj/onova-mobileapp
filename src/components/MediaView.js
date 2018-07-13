// @flow

import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
// eslint-disable-next-line
import Swiper from 'react-native-swiper';
import colors from '../config/colors';

const { width } = Dimensions.get('window');

type Props = {
  source: Array<string>,
};

type State = {
  currentImageIndex: number,
  imageHeight: number,
  isModalVisible: boolean,
};

export default class MediaView extends React.Component<Props, State> {
  _swiper;

  state = {
    currentImageIndex: 0,
    isModalVisible: false,
    imageHeight: 0,
  };

  componentWillMount() {
    Image.getSize(this.props.source[0], (w, h) => {
      this.setState({ imageHeight: Math.floor(h * (width / w)) });
    });
  }

  openModal(index: number) {
    this.setState({ isModalVisible: true, currentImageIndex: index });
  }

  render() {
    const { source } = this.props;
    const { imageHeight, currentImageIndex } = this.state;

    if (source.length > 1) {
      const images = source;
      return (
        <View style={[styles.container, { height: imageHeight + 35 }]}>
          <Swiper
            ref={ref => (this._swiper = ref)}
            autoplay={false}
            loop={false}
            bounces
            paginationStyle={styles.pagination}
            index={currentImageIndex}
            activeDotColor={colors.dkGreyBg}>
            {images.map((image, i) => (
              <TouchableWithoutFeedback
                key={i}
                onPress={() => this.openModal(i)}>
                <Image
                  source={{ uri: image }}
                  style={{ width, height: imageHeight }}
                  resizeMode="contain"
                />
              </TouchableWithoutFeedback>
            ))}
          </Swiper>
          <Modal
            visible={this.state.isModalVisible}
            transparent
            onRequestClose={() => this.setState({ isModalVisible: false })}>
            <ImageViewer
              enableSwipeDown
              onCancel={() => this.setState({ isModalVisible: false })}
              imageUrls={images.map(i => ({ url: i }))}
              index={currentImageIndex}
              onChange={toIndex => {
                if (currentImageIndex < toIndex) {
                  return this._swiper.scrollBy(1, false);
                }
                this._swiper.scrollBy(-1, false);
              }}
            />
          </Modal>
        </View>
      );
    }

    return (
      <View>
        <TouchableWithoutFeedback onPress={() => this.openModal(0)}>
          <Image
            source={{ uri: source[0] }}
            style={{ width, height: this.state.imageHeight }}
            resizeMode={'contain'}
          />
        </TouchableWithoutFeedback>
        <Modal
          visible={this.state.isModalVisible}
          transparent
          onRequestClose={() => this.setState({ isModalVisible: false })}>
          <ImageViewer
            enableSwipeDown
            renderIndicator={() => null}
            onCancel={() => this.setState({ isModalVisible: false })}
            imageUrls={[{ url: source[0] }]}
          />
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    // marginBottom: -35,
  },
  pagination: {
    bottom: 0,
  },
});
