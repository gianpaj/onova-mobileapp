// @flow
import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Platform,
  StatusBar,
  Text,
  TouchableHighlight,
} from 'react-native';
import FastImage from 'react-native-fast-image';

const getImageUrl = (id, width, height) =>
  `https://picsum.photos/${width}/${height}?image=${id}`;

export default class ImageGrid extends React.Component<Props, State> {
  constructor(props: Object) {
    super(props);

    fetch('https://picsum.photos/list')
      .then(res => res.json())
      .then(this._onFetchImagesSuccess)
      .catch(this._onFetchImagesError);
  }

  state = {
    images: [],
    itemHeight: 0,
  };

  _onLayout = e => {
    const width = e.nativeEvent.layout.width;
    this.setState({
      itemHeight: width / 3,
    });
  };

  _onFetchImagesError = () => {
    this.setState({
      error: true,
    });
  };

  _onFetchImagesSuccess = images => {
    this.setState({
      // images,
      images: images.splice(0, 10),
    });
  };

  _getItemLayout = (data, index) => {
    const { itemHeight } = this.state;
    return { length: itemHeight, offset: itemHeight * index, index };
  };

  _onItemPress(item) {
    console.log(item);
  }

  _renderItem = ({ item }) => {
    const uri = getImageUrl(item.id, 200, 200);
    return (
      <View style={styles.imageContainer}>
        <TouchableHighlight
          style={{ flex: 1 }}
          onPress={() => this._onItemPress(item)}>
          <FastImage source={{ uri }} style={styles.image} />
        </TouchableHighlight>
      </View>
    );
  };

  _extractKey = item => {
    return item.id;
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Error fetching images.</Text>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <FlatList
          onLayout={this._onLayout}
          style={styles.list}
          columnWrapperStyle={[
            styles.columnWrapper,
            { height: this.state.itemHeight },
          ]}
          data={this.state.images}
          renderItem={this._renderItem}
          numColumns={3}
          keyExtractor={this._extractKey}
          getItemLayout={this._getItemLayout}
        />
        <View style={styles.statusBarUnderlay} />
      </View>
    );
  }
}

const MARGIN = 1;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const styles = StyleSheet.create({
  statusBarUnderlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: STATUS_BAR_HEIGHT,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  list: {
    marginTop: STATUS_BAR_HEIGHT,
    flex: 1,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: -MARGIN,
    marginRight: -MARGIN,
  },
  image: {
    flex: 1,
    width: 121,
    // height: 121,
    margin: MARGIN,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'stretch',
  },
});
