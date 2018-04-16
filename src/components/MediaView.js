// @flow

import React from 'react';
import { View, Image, Dimensions, StyleSheet } from 'react-native';
// eslint-disable-next-line
import Swiper from 'react-native-swiper';
import colors from '../config/colors';

const { width } = Dimensions.get('window');

type Props = {
  source: Array<string>,
};

type State = {
  imageHeight: number,
};

export default class MediaView extends React.Component<Props, State> {
  state = {
    // isLoading: false,
    imageHeight: 0,
  };

  componentWillMount() {
    Image.getSize(this.props.source[0], (w, h) => {
      this.setState({ imageHeight: Math.floor(h * (width / w)) });
    });
  }

  render() {
    const { source } = this.props;
    if (source.length > 1) {
      const images = source;
      return (
        <View
          style={[styles.container, { height: this.state.imageHeight + 35 }]}>
          <Swiper
            autoplay={false}
            loop={false}
            bounces
            paginationStyle={styles.pagination}
            activeDotColor={colors.dkGreyBg}>
            {images.map((image, i) => (
              <Image
                key={i}
                source={{ uri: image }}
                style={{ width, height: this.state.imageHeight }}
                resizeMode="contain"
              />
            ))}
          </Swiper>
        </View>
      );
    } else {
      const uri = source[0];
      return (
        <View>
          <Image
            source={{ uri }}
            style={{ width, height: this.state.imageHeight }}
            resizeMode={'contain'}
          />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99,
    marginBottom: -35,
  },
  pagination: {
    bottom: 0,
  },
});
