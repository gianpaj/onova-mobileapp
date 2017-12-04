// @flow
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

type Props = {
  URL: string,
};

type State = {
  images: Array,
  itemHeight: number,
  loading: boolean,
  loadingMore: boolean,
  refreshing: boolean,
};

const { width } = Dimensions.get('window');

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
    this.fetchImages();
  }

  fetchImages() {
    // return fetch(`${this.props.URL}?skip=${this.state.skip}`)
    setTimeout(() => {
      return fetch(`${this.props.URL}`)
        .then(res => res.json())
        .then(images => images.splice(0, 20))
        .then(images => {
          this.setState({
            images,
            loading: false,
          });
        })
        .catch(() => {
          this.setState({
            error: true,
          });
        });

    }, 2000);
  }

  onLayout = () => {
    this.setState({
      itemHeight: width / 3,
    });
  };

  getItemLayout = (data, index) => {
    const { itemHeight } = this.state;
    return { length: itemHeight, offset: itemHeight * index, index };
  };

  onItemPress(item) {
    console.log(item);
  }

  renderItem = ({ item }) => {
    const uri = getImageUrl(item.id, 200, 200);
    return (
      <View style={styles.imageContainer}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => this.onItemPress(item)}>
          <FastImage source={{ uri }} style={styles.image} />
        </TouchableOpacity>
      </View>
    );
  };

  _extractKey = item => {
    return item.id;
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.error && (
          <Text style={styles.text}>Error fetching listing.</Text>
        )}
        {this.state.loading && this.renderLoading()}
        {!this.state.loading && (
          <FlatList
            onLayout={this.onLayout}
            style={styles.list}
            columnWrapperStyle={[
              styles.columnWrapper,
              { height: this.state.itemHeight },
            ]}
            refreshControl={this.renderRefreshControl()}
            data={this.state.images}
            renderItem={this.renderItem}
            numColumns={3}
            keyExtractor={this._extractKey}
            getItemLayout={this.getItemLayout}
            // ListHeaderComponent={this.renderHeader}
          />
        )}
      </View>
    );
  }

  renderLoading() {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  renderHeader() {
    return <Text>Yo</Text>;
  }

  renderRefreshControl() {
    return (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={this.fetchImages.bind(this)}
      />
    );
  }
}

const MARGIN = 1;

const styles = StyleSheet.create({
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
    marginTop: -1,
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
    width: (width + MARGIN * 2) / 3,
  },
  imageContainer: {
    alignItems: 'stretch',
  },
});
