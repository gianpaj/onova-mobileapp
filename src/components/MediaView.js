// @flow

import React from 'react';
import { View, Image, Dimensions } from 'react-native';
// import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');

type Props = {
  product: any,
  source: string,
};

type State = {
  imageHeight: number,
};

export default class MediaView extends React.Component<Props, State> {
  state = {
    // isLoading: false,
    imageHeight: 0,
  };

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    // if (this.props.type === 'image') {
    Image.getSize(this.props.source, (w, h) => {
      this.setState({ imageHeight: Math.floor(h * (width / w)) });
    });
    // }
  }

  render() {
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
