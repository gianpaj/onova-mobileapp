// @flow
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

type Props = {
  loadImages(): void,
};

type State = {
  images: Array,
  itemHeight: number,
  loading: boolean,
  refreshing: boolean,
};

var { height, width } = Dimensions.get('window');

const getImageUrl = (id, width, height) =>
  `https://picsum.photos/${width}/${height}?image=${id}`;

export default class ImageGrid extends React.Component<Props, State> {
  constructor(props: Object) {
    super(props);
  }

  state = {
    images: [],
    itemHeight: 0,
    loading: true,
    refreshing: false,
  };

  componentDidMount() {
    this._fetchImages();
  }

  _fetchImages() {
    this.props.loadImages
      .then(this._onFetchImagesSuccess)
      .catch(this._onFetchImagesError);
  }

  _onLayout = e => {
    // const width = e.nativeEvent.layout.width;
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
      images,
      loading: false,
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
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => this._onItemPress(item)}>
          <FastImage source={{ uri }} style={styles.image} />
        </TouchableOpacity>
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
          <Text style={styles.text}>Error fetching listing.</Text>
        </View>
      );
    }
    if (this.state.loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" />
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
          refreshControl={this._renderRefreshControl()}
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

  _renderRefreshControl() {
    return (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={this._fetchImages.bind(this)}
      />
    );
  }
}

const MARGIN = 1;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

const styles = StyleSheet.create({
  statusBarUnderlay: {
    height: STATUS_BAR_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  list: {
    flex: 1,
    marginTop: STATUS_BAR_HEIGHT,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: -MARGIN,
    marginRight: -MARGIN,
  },
  image: {
    flex: 1,
    // height: 121,
    margin: MARGIN,
    width: width / 3 - MARGIN * 2,
  },
  imageContainer: {
    alignItems: 'stretch',
  },
});
