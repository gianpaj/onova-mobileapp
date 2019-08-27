// @flow

import React from 'react';
import { Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import Modal from 'react-native-modal';
// eslint-disable-next-line import/default
import Swiper from 'react-native-swiper';
import FastImage from 'react-native-fast-image';

import colors from '../config/colors';

const { width } = Dimensions.get('window');

type Props = {
  source: Array<string>,
};

type State = {
  currentImageIndex: number,
  imageHeight: number,
  isModalVisible: boolean,
  loaded: boolean,
  // hasError: boolean,
};

export default class MediaView extends React.Component<Props, State> {
  _swiper;
  constructor(props: Props) {
    super(props);
    // props.source[0] = props.source[0].replace(
    //   '.jpg',
    //   '.jpg?bust=' +
    //     Math.random()
    //       .toString(36)
    //       .substring(7)
    // );
    this._swiper = React.createRef();
  }

  state = {
    currentImageIndex: 0,
    imageHeight: 0,
    isModalVisible: false,
    loaded: false,
    // hasError: false,
  };

  // componentDidMount() {
  //   Image.getSize(this.props.source[0], (w, h) => {
  //     this.setState({ imageHeight: Math.floor(h * (width / w)) });
  //   });
  // }

  openModal(index: number) {
    this.setState({ isModalVisible: true, currentImageIndex: index });
  }

  hideModal = () => this.setState({ isModalVisible: false });

  // onError = () => this.setState({ hasError: true });

  handleImgLoaded = () => this.setState({ loaded: true });

  onLoad = ({ nativeEvent: { width: w, height: h } }) => this.setState({ imageHeight: Math.floor(h * (width / w)) });

  render() {
    const { source: images } = this.props;
    const {
      imageHeight,
      currentImageIndex,
      loaded,
      isModalVisible,
      // hasError,
    } = this.state;

    const thumb = images[0].replace('.jpg', '-thumb.jpg');

    if (images.length > 1) {
      return (
        <View style={{ height: (loaded ? imageHeight : width) + 35 }}>
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
                {/* <Image source={{ uri: image }} style={{ width, height: imageHeight }} resizeMode="contain" /> */}
                <View>
                  {!loaded && i === 0 && (
                    <FastImage
                      style={{ width, height: width }}
                      source={{
                        uri: thumb,
                        cache: FastImage.cacheControl.cacheOnly, // FIXME:
                      }}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  )}
                  <FastImage
                    style={{ width, height: imageHeight }}
                    source={{
                      uri: image,
                      priority: i === 0 ? FastImage.priority.high : FastImage.priority.low,
                    }}
                    resizeMode={FastImage.resizeMode.contain}
                    onLoadEnd={this.handleImgLoaded}
                    onLoad={this.onLoad}
                  />
                </View>
              </TouchableWithoutFeedback>
            ))}
          </Swiper>
          <Modal
            isVisible={isModalVisible}
            onBackButtonPress={this.hideModal}
            // onSwipeComplete={this.hideModal}
            // swipeDirection={['up', 'down']}
            style={styles.modal}>
            <ImageViewer
              enableSwipeDown
              onCancel={this.hideModal}
              imageUrls={images.map(i => ({ url: i }))}
              index={currentImageIndex}
              onChange={toIndex => {
                if (currentImageIndex < toIndex) {
                  return this._swiper.current.scrollBy(1, false);
                }
                this._swiper.current.scrollBy(-1, false);
              }}
              renderImage={props => (
                <FastImage
                  style={{
                    width,
                    height: imageHeight,
                  }}
                  source={{
                    uri: props.source.uri,
                    cache: FastImage.cacheControl.cacheOnly, // FIXME:
                  }}
                />
              )}
            />
          </Modal>
        </View>
      );
    }

    return (
      <>
        <TouchableWithoutFeedback onPress={() => this.openModal(0)}>
          <View>
            {!loaded && (
              <FastImage
                style={{ width, height: width }}
                source={{
                  uri: thumb,
                  cache: FastImage.cacheControl.cacheOnly, // FIXME:
                }}
                // resizeMode={FastImage.resizeMode.cover}
              />
            )}
            <FastImage
              style={{ width, height: imageHeight }}
              source={{ uri: images[0] }}
              // resizeMode={FastImage.resizeMode.contain}
              onLoadEnd={this.handleImgLoaded}
              onLoad={this.onLoad}
              // onError={this.onError}
            />
          </View>
        </TouchableWithoutFeedback>
        <Modal
          isVisible={isModalVisible}
          backdropOpacity={1}
          onBackButtonPress={this.hideModal}
          onSwipeComplete={this.hideModal}
          swipeDirection={'down'}
          style={styles.modal}>
          <ImageViewer
            enableSwipeDown
            onCancel={this.hideModal}
            imageUrls={images.map(i => ({ url: i }))}
            index={0}
            renderIndicator={() => null}
            renderImage={props => (
              <FastImage
                style={{
                  width,
                  height: imageHeight,
                }}
                source={{
                  uri: props.source.uri,
                  cache: FastImage.cacheControl.cacheOnly, // FIXME:
                }}
              />
            )}
          />
        </Modal>
      </>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  pagination: {
    bottom: 0,
  },
});
