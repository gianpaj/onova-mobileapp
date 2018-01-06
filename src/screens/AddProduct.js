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
import RadioForm, {
  RadioButton,
  RadioButtonInput,
  RadioButtonLabel,
} from 'react-native-simple-radio-button';
import ImagePicker from 'react-native-image-crop-picker';
import { withNavigationFocus } from '@patwoz/react-navigation-is-focused-hoc';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';

import colors from '../config/colors';
import settings from '../config/settings';

const category_radio_grp_1 = [
  { label: 'Clothes', value: 0 },
  { label: 'Shoes', value: 1 },
  { label: 'Other', value: 2 },
];

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
  grp_1: number,
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
    grp_1: -1,
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
    if (this.state.images[0] == '') {
      this.selectPhotoTapped();
    }
  }

  selectPhotoTapped = i => {
    // console.warn('taking pic');
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
      this.setState({ tags });
    }
  }

  /**
   * numbers only, one dot and 2 decimal points
   */
  changePrice(price: string) {
    const pattern = /^(\b[\d]+[\.]?[\d]{0,2})$/;
    if (pattern.test(price) || price == '') {
      this.setState({ price });
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
            clearButtonMode="while-editing"
            value={this.state.price}
            onChangeText={t => this.changePrice(t)}
            maxLength={8} // 10000.99
          />
          <FormLabel labelStyle={styles.label}>Description:</FormLabel>
          <FormInput
            multiline
            inputStyle={[styles.input, { height: this.state.descHeight }]}
            containerStyle={styles.inputContainer}
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
            containerStyle={styles.inputContainer}
            clearButtonMode="while-editing"
            placeholder="winter,adidas,hat"
            value={this.state.tags}
            onChangeText={t => this.changeTags(t)}
          />
          <View style={{ alignItems: 'center' }}>
            <RadioForm animation formHorizontal>
              {category_radio_grp_1.map((option, i) => (
                <RadioButton labelHorizontal={false} key={i}>
                  <RadioButtonLabel
                    labelHorizontal
                    obj={option}
                    index={i}
                    onPress={grp_1 => this.setState({ grp_1 })}
                    labelStyle={styles.radioButtonLabel}
                  />
                  <RadioButtonInput
                    obj={option}
                    index={i}
                    isSelected={this.state.grp_1 == i}
                    onPress={grp_1 => this.setState({ grp_1 })}
                    borderWidth={2}
                    buttonInnerColor={colors.black}
                    buttonOuterColor={colors.black}
                    buttonSize={19}
                    buttonOuterSize={35}
                    buttonWrapStyle={styles.radiobButtonInput}
                  />
                </RadioButton>
              ))}
            </RadioForm>
          </View>
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
    color: colors.black,
    width: '100%',
  },
  inputContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  radioButtonLabel: {
    marginBottom: 10,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  radiobButtonInput: {
    marginLeft: '5%',
    marginRight: '5%',
  },
});
