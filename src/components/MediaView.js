// @flow

import React from 'react';
import { Dimensions, Image, Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
// eslint-disable-next-line import/default
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
  // singleImageLoaded: boolean,
  // hasError: boolean,
};

export default class MediaView extends React.Component<Props, State> {
  _swiper;
  constructor(props: Props) {
    super(props);
    this._swiper = React.createRef();
  }

  state = {
    currentImageIndex: 0,
    imageHeight: 0,
    isModalVisible: false,
    // singleImageLoaded: false,
    // hasError: false,
  };

  componentDidMount() {
    Image.getSize(this.props.source[0], (w, h) => {
      this.setState({ imageHeight: Math.floor(h * (width / w)) });
    });
  }

  openModal(index: number) {
    this.setState({ isModalVisible: true, currentImageIndex: index });
  }

  // onError = () => this.setState({ hasError: true });

  // singleImageHasLoaded = () => this.setState({ singleImageLoaded: true });

  render() {
    const { source: images } = this.props;
    const {
      imageHeight,
      currentImageIndex,
      // singleImageLoaded,
      isModalVisible,
      // hasError,
    } = this.state;

    if (images.length > 1) {
      return (
        <View style={{ height: imageHeight + 35 }}>
          <Swiper
            ref={this._swiper}
            autoplay={false}
            loop={false}
            bounces
            paginationStyle={styles.pagination}
            index={currentImageIndex}
            activeDotColor={colors.dkGreyBg}>
            {images.map((image, i) => (
              <TouchableWithoutFeedback key={i} onPress={() => this.openModal(i)}>
                <Image source={{ uri: image }} style={{ width, height: imageHeight }} resizeMode="contain" />
              </TouchableWithoutFeedback>
            ))}
          </Swiper>
          <Modal visible={isModalVisible} transparent onRequestClose={() => this.setState({ isModalVisible: false })}>
            <ImageViewer
              enableSwipeDown
              onCancel={() => this.setState({ isModalVisible: false })}
              imageUrls={images.map(i => ({ url: i }))}
              index={currentImageIndex}
              onChange={toIndex => {
                if (currentImageIndex < toIndex) {
                  return this._swiper.current.scrollBy(1, false);
                }
                this._swiper.current.scrollBy(-1, false);
              }}
            />
          </Modal>
        </View>
      );
    }

    return (
      <>
        <TouchableWithoutFeedback style={{ borderWidth: 1 }} onPress={() => this.openModal(0)}>
          {/* TODO: show gray low-res thumb while loading */}
          {/* {isiOS && !singleImageLoaded && !hasError && (
              <Image
                source={{
                  uri: source[0].replace('.jpg', '-thumb.jpg'),
                  cache: 'only-if-cached',
                }}
                style={{ width, height: this.state.imageHeight }}
              />
            )} */}
          <Image
            source={{ uri: images[0] }}
            style={{ width, height: this.state.imageHeight }}
            resizeMode={'contain'}
            // onLoadEnd={this.singleImageHasLoaded}
            // onError={this.onError}
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
            imageUrls={[{ url: images[0] }]}
          />
        </Modal>
      </>
    );
  }
}

const styles = StyleSheet.create({
  pagination: {
    bottom: 0,
  },
});
