// @flow

import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  Body,
  Button as NBButton,
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
import {
  TextareaItem,
  ImagePicker as AntImagePicker,
  WingBlank,
} from 'antd-mobile';

import { HR, TagInput } from '../components';

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { UserData, ReduxState } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

const category_radio_grp_1 = [
  { label: 'Clothes', value: 0 },
  { label: 'Shoes', value: 1 },
  { label: 'Other', value: 2 },
];

const category_radio_grp_2 = [
  { label: 'Man', value: 0 },
  { label: 'Woman', value: 1 },
  { label: 'Other', value: 2 },
];

type Props = {
  isFocused: boolean,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
};

type State = {
  description: string,
  images: any,
  price: string,
  tags: Array<string>,
  tagsText: string,
  grp_1: number,
  grp_2: number,
  pending: boolean,
};

export class AddProductScreen extends React.Component<Props, State> {
  static navigationOptions = (props: any) => {
    return {
      // navigate to the screen instead of showing as a normal tab screen
      tabBarOnPress: ({ scene }: any) => {
        if (!scene.focused) {
          props.navigation.navigate('addProduct', { focused: !scene.focused });
        }
      },
    };
  };

  state = {
    description: '',
    price: '',
    tags: [],
    tagsText: '',
    grp_1: -1,
    grp_2: -1,
    images: [],
    pending: false,
  };

  componentDidMount() {
    // const { params } = this.props.navigation.state;
    // if (params && params.focused == true) {
    this.takePicture();
    // }
  }

  takePicture() {
    if (this.state.images.length == 0) {
      this.selectPhotoTapped(0);
    }
  }

  selectPhotoTapped = (i: number = 0) => {
    if (this.state.pending) return;
    // console.warn('taking pic');
    // ImagePicker.openPicker({
    ImagePicker.openCamera({
      width: 700,
      height: 700,
      cropping: true,
      // multiple: true // with openPicker()
      // loadingLabelText: 'Loading image...', // (ios only)
    })
      .then(response => {
        let image = {
          url: response.path,
          id: i,
        };

        this.setState(prevState => {
          // if we want to replace an existing photo
          if (prevState.images[i]) {
            const copy = [...prevState.images];
            copy[i] = image;
            return {
              images: copy,
            };
          }

          return {
            images: [...prevState.images, image],
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

  addItem = () => {
    const { description, images, price, grp_1, grp_2, tags } = this.state;

    this.setState({ pending: true, tagsText: '' });

    const formData = new FormData();
    images.forEach((image, i) => {
      // $FlowFixMe
      formData.append('photos', {
        uri: image.url,
        type: 'image/jpeg',
        name: 'image' + i + '.jpg',
      });
    });
    formData.append('description', description);
    formData.append('price', price);
    formData.append('categoryIds', grp_1.toString());
    formData.append('typeIds', grp_2.toString());
    if (tags.length) formData.append('tags', JSON.stringify(tags));

    // const config = {
    //   onUploadProgress: function(progressEvent) {
    //     const percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
    //   },
    // };

    const { token } = this.props.userData;
    api
      .post('/api/products', formData, { token })
      .then(res => {
        console.debug(res);
        this.closeModal();
      })
      .catch(err => {
        console.debug(err);
        ui.showToast(err.message, 'warning');
      })
      // final
      .then(() => {
        this.setState({ pending: false });
      });
  };

  /**
   * min 3 letters, max 30. max 30 tags
   */
  changeTags(tags: string) {
    const pattern = /^(\b[a-z][a-z0-9,]*)$/i;
    if ((pattern.test(tags) || tags == '') && tags.indexOf(',,') == -1) {
      // this.setState({ tags });
    }
  }

  changeTagsTest = (tagsText: string) => {
    const textWithoutSeparators = tagsText.replace(/,|;| | \n/gi, '');
    // if the tag is longer the maximum
    // OR if it doesn't match the regex
    if (
      textWithoutSeparators.length > settings.MAX_LENGTH_PER_TAG ||
      (textWithoutSeparators.length > 1 &&
        !settings.HASHTAG_REGEX.test(textWithoutSeparators))
    )
      return;

    const lastTyped = tagsText.charAt(tagsText.length - 1);
    const parseWhen = [',', ' ', ';', '\n'];

    // if a separator was typed at the end of the tag
    // AND the tag has the minimum length
    if (
      parseWhen.indexOf(lastTyped) > -1 &&
      textWithoutSeparators.length >= settings.MIN_LENGTH_PER_TAG
    ) {
      return this.setState({
        tags: [...this.state.tags, this.state.tagsText],
        tagsText: '',
      });
    }
    this.setState({ tagsText: textWithoutSeparators });
  };

  /**
   * numbers only, one dot and 2 decimal points
   */
  changePrice(price: string) {
    const pattern = /^(\b[\d]+[\.]?[\d]{0,2})$/;
    if (pattern.test(price) || price == '') {
      this.setState({ price });
    }
  }

  addEnabled(): boolean {
    // const pricePattern = /^\d+(\.\d{2})?$/;
    // const tagsPattern = /^(\b[a-z][a-z0-9]*)$/i;

    // return true if all of these are true
    return (
      // If images are added
      this.state.images.length > 0 &&
      // If the item is uploading is not pending
      !this.state.pending &&
      // If the price is not empty
      this.state.price !== '' &&
      // if the description doesn't exceed the maximum length
      this.state.description.trim().length >= settings.MIN_LENGTH_DESCRIPTION &&
      // if there's the minimum required of tags
      this.state.tags.length >= settings.MIN_TAGS &&
      // if there's a clothing category selected
      this.state.grp_1 > -1 &&
      // if there's a clothing type selected
      this.state.grp_2 > -1
    );
  }

  /*renderSquare(e, i) {
    const uri = this.state.images[i];

    return (
      <TouchableOpacity
        key={i}
        onPress={() => !this.state.pending && this.selectPhotoTapped(i)}>
        <View
          style={[
            styles.image,
            styles.imageContainer,
            { marginBottom: 20, borderRightWidth: 0 },
          ]}>
          {uri ? (
            <Image style={styles.image} source={{ uri }} />
          ) : (
            <Text>Select a Photo</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }*/

  render() {
    const { images } = this.state;
    return (
      images.length > 0 && (
        <Container>
          <Header>
            <Left>
              <NBButton transparent onPress={() => this.closeModal()}>
                <Icon name="close" size={28} />
              </NBButton>
            </Left>
            <Body>
              <Text>Add Item</Text>
            </Body>
            <Right>
              <NBButton
                transparent
                disabled={!this.addEnabled()}
                // eslint-disable-next-line
              style={{ backgroundColor: 'transparent' }}
                onPress={this.addItem}>
                <Icon
                  name="check"
                  style={!this.addEnabled() && { color: colors.grey3 }}
                  size={28}
                />
              </NBButton>
            </Right>
          </Header>
          <Content>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <WingBlank>
                <AntImagePicker
                  files={images}
                  onChange={images => this.setState({ images })}
                  onImageClick={i => this.selectPhotoTapped(i)}
                  onAddImageClick={() => this.selectPhotoTapped(images.length)}
                  selectable={images.length < 6}
                />
              </WingBlank>
            </View>
            <FormLabel labelStyle={styles.label}>Price:</FormLabel>
            <FormInput
              autoCorrect={false}
              clearButtonMode="while-editing"
              containerStyle={styles.inputContainer}
              editable={!this.state.pending}
              inputStyle={styles.input}
              keyboardType="numeric"
              maxLength={8} // 10000.99
              onChangeText={t => this.changePrice(t)}
              placeholder="123 UAH"
              value={this.state.price}
            />
            <FormLabel labelStyle={styles.label}>Description:</FormLabel>
            <TextareaItem
              editable={!this.state.pending}
              style={styles.inputContainerNew}
              rows={3}
              count={settings.MAX_LENGTH_DESCRIPTION}
              onChangeText={t => this.setState({ description: t })}
              placeholder="Please provide details such as brand, size, condition about the item"
              value={this.state.description}
              error={
                this.state.description.trim().length <
                settings.MIN_LENGTH_DESCRIPTION
              }
            />
            <FormLabel labelStyle={styles.label}>#tags:</FormLabel>
            <TagInput
              inputDefaultWidth={160}
              editable={!this.state.pending}
              labelExtractor={tag => tag}
              onChange={tags => this.setState({ tags })}
              onChangeText={this.changeTagsTest}
              tagColor={colors.primary}
              tagTextColor="white"
              text={this.state.tagsText}
              value={this.state.tags}
              inputProps={{ placeholder: 'winter, adidas, hat' }}
            />
            <View style={styles.grps}>
              <RadioForm animation formHorizontal>
                {category_radio_grp_1.map((option, i) => (
                  <RadioButton labelHorizontal={false} key={i}>
                    <RadioButtonLabel
                      labelHorizontal
                      obj={option}
                      index={i}
                      onPress={grp_1 =>
                        !this.state.pending && this.setState({ grp_1 })
                      }
                      labelStyle={styles.radioButtonLabel}
                    />
                    <RadioButtonInput
                      obj={option}
                      index={i}
                      isSelected={this.state.grp_1 == i}
                      onPress={grp_1 =>
                        !this.state.pending && this.setState({ grp_1 })
                      }
                      borderWidth={2}
                      buttonInnerColor={colors.black}
                      buttonOuterColor={colors.black}
                      buttonSize={19}
                      buttonOuterSize={35}
                      buttonWrapStyle={styles.radioButtonInput}
                    />
                  </RadioButton>
                ))}
              </RadioForm>
            </View>
            <HR />
            <View style={styles.grps}>
              <RadioForm animation formHorizontal>
                {category_radio_grp_2.map((option, i) => (
                  <RadioButton labelHorizontal={false} key={i}>
                    <RadioButtonLabel
                      labelHorizontal
                      obj={option}
                      index={i}
                      onPress={grp_2 =>
                        !this.state.pending && this.setState({ grp_2 })
                      }
                      labelStyle={styles.radioButtonLabel}
                    />
                    <RadioButtonInput
                      obj={option}
                      index={i}
                      isSelected={this.state.grp_2 == i}
                      onPress={grp_2 =>
                        !this.state.pending && this.setState({ grp_2 })
                      }
                      borderWidth={2}
                      buttonInnerColor={colors.black}
                      buttonOuterColor={colors.black}
                      buttonSize={19}
                      buttonOuterSize={35}
                      buttonWrapStyle={styles.radioButtonInput}
                    />
                  </RadioButton>
                ))}
              </RadioForm>
            </View>
          </Content>
        </Container>
      )
    );
  }
}

// const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // imageContainer: {
  //   borderColor: colors.grey3,
  //   borderWidth: 3 / PixelRatio.get(),
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // image: {
  //   width: width / 6,
  //   height: width / 6,
  // },
  label: {
    fontWeight: '600',
    color: colors.black,
  },
  input: {
    color: colors.black,
    width: '100%',
  },
  inputContainer: {
    marginVertical: 10,
  },
  // eslint-disable-next-line
  inputContainerNew: {
    backgroundColor: 'transparent',
    marginTop: 10,
    marginBottom: 28,
    marginRight: 12,
    right: 3.3,
  },
  grps: {
    alignItems: 'center',
    left: -7,
    justifyContent: 'center',
    width: '100%',
  },
  radioButtonLabel: {
    marginBottom: 10,
    paddingLeft: '5%',
    paddingRight: '5%',
  },
  radioButtonInput: {
    marginHorizontal: '5%',
    width: 60,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const AddProduct = connect(mapStateToProps)(AddProductScreen);
