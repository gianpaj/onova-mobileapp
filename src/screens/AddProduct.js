// @flow

import React from 'react';
// prettier-ignore
import {
  Image,
  Text,
  View,
  TouchableOpacity,
  PixelRatio,
  StyleSheet,
// $FlowFixMe
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// prettier-ignore
import {
  Body,
  Button,
  Container,
  Header,
  Left,
  Right,
} from 'native-base';
import ImagePicker from 'react-native-image-crop-picker';
import { withNavigationFocus } from '@patwoz/react-navigation-is-focused-hoc';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';

import colors from '../config/colors';

type Props = {
  isFocused: boolean,
  navigation: NavigationScreenProp,
};

type State = {
  images: any,
};

class AddProductScreen extends React.Component<Props, State> {
  static navigationOptions = props => {
    return {
      // navigate to the screen instead of showing as a normal tab screen
      tabBarOnPress: ({ scene }) => {
        if (!scene.focused) {
          props.navigation.navigate('addProduct');
        }
      },
    };
  };

  state = {
    images: [],
  };

  componentWillMount() {
    console.log('componentWillMount');
    // this.takePicture();
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

  takePicture() {
    if (this.state.images.length < 1) {
      this.selectPhotoTapped();
    }
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
        this.closeModal();
      });
  };

  closeModal() {
    this.props.navigation.goBack();
  }

  addItem() {
    console.warn('implement me');
  }

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={() => this.closeModal()}>
              <Icon name="close" size={28} />
            </Button>
          </Left>
          <Body>
            <Text>Add Item</Text>
          </Body>
          <Right>
            <Button transparent onPress={this.addItem}>
              <Icon name="check" size={28} />
            </Button>
          </Right>
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

export const AddProduct = withNavigationFocus(AddProductScreen);

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: '#F5FCFF',
  // },
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
