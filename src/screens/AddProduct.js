// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  ActionSheet,
  Body,
  Button as NBButton,
  Container,
  Content,
  Left,
  Right,
  Title,
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
  Toast,
  ImagePicker as AntImagePicker,
  WingBlank,
} from 'antd-mobile';

import { Header, HR, TagInput } from '../components';

import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { UserData, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

const width = Dimensions.get('window').width;

const brands = require('../assets/brands.json');

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

const IMAGE_WIDTH = 700;
const IMAGE_HEIGHT = 700;

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
  numberOfBrands: number,
  inEditMode: boolean,
  uuid: string,
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
    numberOfBrands: 0,
    inEditMode: false,
    uuid: '',
  };

  componentDidMount() {
    const { params } = this.props.navigation.state;
    // if editing
    if (params) {
      const { item }: { item: Product } = params;
      console.log(item);
      let images = [];
      for (let i = 0; i < item.photoURIs.length; i++) {
        images.push({
          url: item.photoURIs[i],
          id: i,
        });
      }
      this.setState({
        inEditMode: true,
        images,
        description: item.description,
        price: item.price,
        tags: item.tags,
        grp_1: item.categoryIds[0],
        grp_2: item.typeIds[0],
        uuid: item.uuid,
      });
    } else if (this.state.images.length == 0) {
      this.selectPhotoTapped(0);
    }
  }

  selectPhotoTapped = (i: number = 0) => {
    if (this.state.pending) return;
    const BUTTONS = ['Camera', 'Gallery', 'Cancel'];
    ActionSheet.show(
      {
        options: BUTTONS,
        destructiveButtonIndex: 0,
        cancelButtonIndex: BUTTONS.indexOf('Cancel'),
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            ImagePicker.openCamera({
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
              cropping: true,
              // loadingLabelText: 'Loading image...', // (ios only)
            })
              .then(response => this.processPhoto(response, i))
              .catch(() => !this.state.inEditMode && this.closeModal());
            break;
          case 1:
            ImagePicker.openPicker({
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
              cropping: true,
              // loadingLabelText: 'Loading image...', // (ios only)
            })
              .then(response => this.processPhoto(response, i))
              .catch(() => !this.state.inEditMode && this.closeModal());
            break;
          default:
            if (!this.state.inEditMode) this.closeModal();
            break;
        }
      }
    );
  };

  processPhoto(response: any, i: number) {
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
  }

  closeModal() {
    this.props.navigation.goBack();
  }

  addOrEditItem = () => {
    const {
      description,
      images,
      price,
      grp_1,
      grp_2,
      tags,
      inEditMode,
      uuid,
    } = this.state;

    this.setState({ pending: true, tagsText: '' });
    Toast.loading('Uploading...', 30);

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

    if (inEditMode) {
      return (
        api
          .put(`/api/products/${uuid}`, formData, { token, timeout: 300000 })
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
            Toast.hide();
          })
      );
    }
    api
      .post('/api/products', formData, { token, timeout: 300000 })
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
        Toast.hide();
      });
  };

  /**
   * triggers only when a tag is deleted
   */
  changeTags = (tags: Array<string>) => {
    // if there no are any brands in the hashtags
    let found = this.state.tags.some(r => brands.brands.indexOf(r) >= 0);
    if (!found) {
      this.setState({ numberOfBrands: 0 });
    }
    this.setState({ tags });
  };

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
      textWithoutSeparators.length >= settings.MIN_LENGTH_PER_TAG &&
      this.state.tags.length < settings.MAX_TAGS &&
      this.onlyOneBrand(this.state.tagsText) == true
    ) {
      const newTags = new Set([...this.state.tags, this.state.tagsText]);
      return this.setState({
        tags: Array.from(newTags),
        tagsText: '',
      });
    }
    this.setState({ tagsText: textWithoutSeparators });
  };

  /**
   * if a brand is typed, allow only one to be added
   */
  onlyOneBrand(text: string): boolean {
    if (brands.brands.indexOf(text) == -1) return true;
    if (
      brands.brands.indexOf(text) > -1 &&
      this.state.numberOfBrands < settings.MAX_BRAND_TAGS
    ) {
      this.setState({ numberOfBrands: this.state.numberOfBrands + 1 });
      return true;
    }
    return false;
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

  onImageChange = (images: Array<any>) => {
    if (images.length < 1 && !this.state.inEditMode) this.closeModal();
    this.setState({ images });
  };

  onChangeDescription = (t: string) => this.setState({ description: t });

  render() {
    const { images, tags, inEditMode } = this.state;

    if (images.length < 1 && !inEditMode) return null;

    return (
      <Container>
        <Header style={{ backgroundColor: colors.bgDefault }}>
          <Left style={styles.container}>
            <NBButton transparent onPress={() => this.closeModal()}>
              <Icon name="close" size={28} />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>
              {inEditMode ? 'Edit Item' : 'Add Item'}
            </Title>
          </Body>
          <Right>
            <NBButton
              transparent
              disabled={!this.addEnabled()}
              style={{ backgroundColor: colors.transparent }}
              onPress={this.addOrEditItem}>
              <Icon
                name="check"
                style={!this.addEnabled() && { color: colors.grey4 }}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <Content style={{ backgroundColor: colors.bgDefault }}>
          <View style={{ flex: 1, flexDirection: 'row', paddingTop: 18 }}>
            <WingBlank>
              <AntImagePicker
                files={images}
                onChange={this.onImageChange}
                onImageClick={i => this.selectPhotoTapped(i)}
                onAddImageClick={() => this.selectPhotoTapped(images.length)}
                selectable={images.length < 6}
                styles={imagePickerStyles}
              />
            </WingBlank>
          </View>
          <View style={{ paddingHorizontal: 12 }}>
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
              containerStyle={{ borderBottomWidth: 5, marginRight: 12 }}
              rows={3}
              count={settings.MAX_LENGTH_DESCRIPTION}
              onChangeText={this.onChangeDescription}
              placeholder="Please provide details such as brand, size, condition about the item"
              value={this.state.description}
              error={
                this.state.description.trim().length <
                settings.MIN_LENGTH_DESCRIPTION
              }
            />
            <FormLabel labelStyle={styles.label}>#tags:</FormLabel>
            <TagInput
              inputDefaultWidth={140}
              maxHeight={2000}
              editable={!this.state.pending}
              labelExtractor={tag => tag}
              onChange={this.changeTags}
              onChangeText={this.changeTagsTest}
              tagColor={colors.primary}
              tagTextColor="white"
              text={this.state.tagsText}
              value={tags}
              inputProps={{
                placeholder: tags.length < 1 ? 'adidas, summer' : '',
              }}
            />
          </View>
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
                    buttonOuterSize={19}
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
                    buttonOuterSize={19}
                    buttonWrapStyle={styles.radioButtonInput}
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

// const { width } = Dimensions.get('window');

const imagePickerStyles = {
  container: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  size: {
    width: width / 6 - 10,
    height: width / 6 - 10,
  },
  item: {
    marginRight: 5,
    marginBottom: 6,
    overflow: 'hidden',
  },
  image: {
    overflow: 'hidden',
    borderRadius: 3,
  },
  closeWrap: {
    width: 16,
    height: 16,
    backgroundColor: '#999',
    borderRadius: 8,
    position: 'absolute',
    top: 4,
    right: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeText: {
    color: colors.white,
    backgroundColor: 'transparent',
    fontSize: 20,
    height: 20,
    marginTop: -8,
    fontWeight: '300',
  },
  plusWrap: {
    borderRadius: 3,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusWrapNormal: {
    backgroundColor: colors.white,
    borderColor: '#dddddd',
  },
  plusWrapHighlight: {
    backgroundColor: '#dddddd',
    borderColor: '#dddddd',
  },
  plusText: {
    fontSize: 32,
    backgroundColor: 'transparent',
    fontWeight: '100',
    color: '#888888',
  },
};

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
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
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
    marginVertical: 0,
  },
  inputContainerNew: {
    backgroundColor: colors.transparent,
    marginTop: 0,
    marginHorizontal: 12,
    marginBottom: 28,
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
