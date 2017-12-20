// @flow

import React from 'react';
// $FlowFixMe
import { View, Image, Dimensions, StyleSheet } from 'react-native';
import { Swiper } from 'react-native-swiper';
import colors from '../config/colors';

const { width } = Dimensions.get('window');

type Props = {
  product: any,
  source: any,
};

type State = {
  imageHeight: number,
};

export class MediaView extends React.Component<Props, State> {
  state = {
    // isLoading: false,
    imageHeight: 0,
  };

  constructor(props: Props) {
    super(props);
  }

  componentWillMount() {
    // if (this.props.type === 'image') {
    if (typeof this.props.source != 'object') {
      Image.getSize(this.props.source, (w, h) => {
        this.setState({ imageHeight: Math.floor(h * (width / w)) });
      });
    } else {
      Image.getSize(this.props.source['0'], (w, h) => {
        this.setState({ imageHeight: Math.floor(h * (width / w)) });
      });
      for (let key in this.props.source) {
        const url = this.props.source[key];
        console.log(url);
      }
    }
  }

  render() {
    if (typeof this.props.source == 'object') {
      const images = this.props.source;
      return (
        <View style={[styles.container, { height: this.state.imageHeight }]}>
          <Swiper
            style={styles.wrapper}
            autoplay={false}
            loop={false}
            bounces
            paginationStyle={styles.pagination}
            activeDotColor={colors.dkGreyBg}>
            {Object.keys(images).map(key => (
              <Image
                key={key}
                source={{ uri: images[key] }}
                style={{ width, height: this.state.imageHeight }}
                resizeMode={'contain'}
              />
            ))}
          </Swiper>
        </View>
      );
    }
    return (
      <View>
        <Image
          source={{ uri: this.props.source }}
          style={{ width, height: this.state.imageHeight }}
          resizeMode={'contain'}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99,
  },
  pagination: {
    bottom: -35,
  },
});
