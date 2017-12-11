// @flow

import React from 'react';
// prettier-ignore
import {
  // AsyncStorage,
  Image,
  Text,
  View,
  TouchableOpacity,
  PixelRatio,
  StyleSheet,
} from 'react-native';
// prettier-ignore
import {
  Body,
  Container,
  Header,
} from 'native-base';
import ImagePicker from 'react-native-image-crop-picker';
import { withNavigationFocus } from '@patwoz/react-navigation-is-focused-hoc';

import colors from '../config/colors';

type Props = {
  isFocused: boolean,
  navigation: any,
};

type State = {
  images: Array,
};

class AddProduct extends React.Component<Props, State> {
  state = {
    images: [],
  };

  componentWillMount() {
    console.log('componentWillMount');
    this.takePicture();
  }

  takePicture() {
    if (this.state.images.length < 1) {
      this.selectPhotoTapped();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.isFocused && nextProps.isFocused) {
      // screen re-enter (refresh data, update ui ...)
      this.takePicture();
    }

    // if (this.props.isFocused && !nextProps.isFocused) {
    //   console.log('screen exit');
    // }
  }

  selectPhotoTapped = () => {
    ImagePicker.openCamera({
      width: 700,
      height: 700,
      cropping: true,
      // loadingLabelText: 'Loading image...', // (ios only)
      // mediaType: 'photo',
    })
      .then(response => {
        console.log(response);
        let source = { uri: response.path };

        this.setState(prevState => {
          return {
            images: [...prevState.images, source],
          };
        });
      })
      .catch(() => {
        this.props.navigation.goBack();
      });
  };

  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Text>Add Item</Text>
          </Body>
        </Header>
        <Body>
          <TouchableOpacity onPress={this.selectPhotoTapped}>
            <View
              style={[
                styles.avatar,
                styles.avatarContainer,
                { marginBottom: 20 },
              ]}>
              {this.state.images[0] === null ? (
                <Text>Select a Photo</Text>
              ) : (
                <Image style={styles.avatar} source={this.state.images[0]} />
              )}
            </View>
          </TouchableOpacity>
        </Body>
      </Container>
    );
  }
}

export default withNavigationFocus(AddProduct);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  avatarContainer: {
    borderColor: colors.grey4,
    borderWidth: 1 / PixelRatio.get(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 75,
    width: 150,
    height: 150,
  },
});
