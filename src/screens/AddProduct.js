// @flow

import React from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  // $FlowFixMe
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  Body,
  Button,
  Container,
  Content,
  Header,
  Left,
  Right,
} from 'native-base';
import { FormInput, FormLabel } from 'react-native-elements';
import ImagePicker from 'react-native-image-crop-picker';
import { withNavigationFocus } from '@patwoz/react-navigation-is-focused-hoc';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';

import colors from '../config/colors';
import settings from '../config/settings';

type Props = {
  isFocused: boolean,
  navigation: NavigationScreenProp,
};

type State = {
  descHeight: number,
  description: string,
  images: any,
  price: string,
  tags: string,
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
    descHeight: 50,
    description: '',
    images: ['', '', '', '', '', ''],
    price: '',
    tags: '',
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

  selectPhotoTapped = i => {
    ImagePicker.openCamera({
      width: 700,
      height: 700,
      cropping: true,
      // loadingLabelText: 'Loading image...', // (ios only)
      // mediaType: 'photo',
    })
      .then(response => {
        let source = response.path;

        this.setState(prevState => {
          const copy = [...prevState.images];
          copy[i] = source;
          return {
            images: copy,
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

  onDescriptionChange(event) {
    const { contentSize, text } = event.nativeEvent;

    this.setState({
      description: text,
      descHeight: contentSize.height > 50 ? contentSize.height : 50,
    });
  }

  /**
   * min 3 letters, max 30. max 30 tags
   */
  changeTags(tags: string) {
    const pattern = /^(\b[a-z][a-z0-9,]*)$/i;
    if ((pattern.test(tags) || tags == '') && tags.indexOf(',,') == -1) {
      this.setState({ tags: tags });
    }
  }

  renderSquare(uri, i) {
    return (
      <TouchableOpacity key={i} onPress={() => this.selectPhotoTapped(i)}>
        <View
          style={[
            styles.image,
            styles.imageContainer,
            { marginBottom: 20, borderRightWidth: 0 },
          ]}>
          {uri == '' ? (
            <Text>Select a Photo</Text>
          ) : (
            <Image style={styles.image} source={{ uri }} />
          )}
        </View>
      </TouchableOpacity>
    );
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
        <Content>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {this.state.images.map((square, i) => this.renderSquare(square, i))}
          </View>
          <FormLabel labelStyle={styles.label}>Price:</FormLabel>
          <FormInput
            inputStyle={styles.input}
            containerStyle={{ margin: 10 }}
            autoCorrect={false}
            keyboardType="numeric"
            placeholder="123 UAH"
            value={this.state.price}
            onChangeText={t => this.setState({ price: t })}
            maxLength={8} // 10000.99
          />
          <FormLabel labelStyle={styles.label}>Description:</FormLabel>
          <FormInput
            multiline
            inputStyle={[styles.input, { height: this.state.descHeight }]}
            containerStyle={{ marginTop: 10, marginBottom: 10 }}
            clearButtonMode="while-editing"
            placeholder="Please provide details such as brand, size, condition about the item"
            value={this.state.description}
            onContentSizeChange={this.onDescriptionChange.bind(this)}
            maxLength={settings.MAX_LENGTH_DESCRIPTION}
          />
          <FormLabel labelStyle={styles.label}>#tags:</FormLabel>
          <FormInput
            inputStyle={styles.input}
            autoCapitalize="none"
            containerStyle={{ marginTop: 10, marginBottom: 10 }}
            clearButtonMode="while-editing"
            placeholder="winter,adidas,hat"
            value={this.state.tags}
            onChangeText={t => this.changeTags(t)}
          />
        </Content>
      </Container>
    );
  }
}

export const AddProduct = withNavigationFocus(AddProductScreen);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  imageContainer: {
    borderColor: colors.grey3,
    borderWidth: 3 / PixelRatio.get(),
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width / 6,
    height: width / 6,
  },
  label: {
    fontWeight: '600',
    color: colors.black,
  },
  input: {
    paddingRight: 20,
    color: colors.black,
  },
});
