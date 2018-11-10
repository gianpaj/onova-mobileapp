// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
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
import { FormLabel } from 'react-native-elements';
import RadioForm, {
  RadioButton,
  RadioButtonInput,
  RadioButtonLabel,
} from 'react-native-simple-radio-button';
import ImagePicker from 'react-native-image-crop-picker';
import { InputItem, TextareaItem, Toast } from 'antd-mobile-rn';
import Foect from 'foect';

import { Header, HR, TagInput } from '../components';
import AntImagePicker from '../components/ImagePicker';
import { enableRefresh } from '../actions/actionCreator';
import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { Dispatch, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';
const { width } = Dimensions.get('window');

const brands = require('../assets/brands.json');

const IMAGE_WIDTH = 2560;
const IMAGE_HEIGHT = 2560;
const MAX_IMAGES = 6;

const imagePickerOptons = {
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  compressImageMaxWidth: IMAGE_WIDTH,
  compressImageMaxHeight: IMAGE_HEIGHT,
  compressImageQuality: 0.7,
  cropping: false,
  cropperCircleOverlay: false,
  mediaType: 'photo',
  maxFiles: MAX_IMAGES, // ios
  // cropperToolbarTitle: I18n.t('add_or_edit_item.cropper_toolbar_title'),
  // ios
  // cropperChooseText: I18n.t('add_or_edit_item.cropper_choose_text'),
  // ios
  // cropperCancelText: I18n.t('add_or_edit_item.cropper_cancel_text'),
  // ios
  loadingLabelText: I18n.t('add_or_edit_item.image_processing'),
};

const CAMERA = I18n.t('add_or_edit_item.select_photo_source_camera');
const GALLERY = I18n.t('add_or_edit_item.select_photo_source_gallery');
const CANCEL = I18n.t('add_or_edit_item.select_photo_source_cancel');

type Image = {
  url: string,
  id: number,
  isUploading: boolean,
};

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  token: string,
};

type State = {
  description: string,
  descriptionFocused: boolean,
  grp_1: number,
  grp_2: number,
  images: Array<Image>,
  inEditMode: boolean,
  isUploading: boolean,
  numberOfBrands: number,
  order: Array<number>,
  price: string,
  progress: number,
  tags: Array<string>,
  tagsText: string,
  uuid: string,
};

export class AddOrEditProductScreen extends React.Component<Props, State> {
  priceControl;

  state = {
    description: '',
    descriptionFocused: false,
    grp_1: -1,
    grp_2: -1,
    images: [],
    inEditMode: false,
    isUploading: false,
    numberOfBrands: 0,
    order: [],
    price: '',
    progress: 0,
    tags: [],
    tagsText: '',
    uuid: '',
  };

  async componentDidMount() {
    // $FlowFixMe
    const { params } = this.props.navigation.state;

    // for development
    // const data = await api.getProduct('D6cEHxhIX');
    // console.warn(data);
    // const params = { item: data };

    if (params && params.item) {
      this.setState({ inEditMode: true });
      const { item }: { item: Product } = params;
      let images = [];
      for (let i = 0; i < item.photoURIs.length; i++) {
        images.push({
          url: item.photoURIs[i],
          id: i,
          isUploading: false,
        });
      }
      this.priceControl.onChange(item.price);
      return this.setState({
        images,
        description: item.description,
        price: item.price,
        tags: item.tags,
        grp_1: item.categoryIds[0],
        grp_2: item.typeIds[0],
        uuid: item.uuid,
      });
    }
    this.selectPhotoTapped(0);
  }

  selectPhotoTapped = (i: number = 0, multiple: boolean = true) => {
    if (global.__TESTING__) {
      return ImagePicker.openPicker()
        .then(() => {
          const url =
            'https://storage.googleapis.com/temp-uploads.onova.co/1537607915827.jpg';
          this.appendSinglePhoto(url, i);
        })
        .catch(() => this.closeModalConditional());
    }

    const BUTTONS = [CAMERA, GALLERY, CANCEL];
    ActionSheet.show(
      {
        options: BUTTONS,
        // destructiveButtonIndex: 2,
        cancelButtonIndex: BUTTONS.indexOf(CANCEL),
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            ImagePicker.openCamera({
              ...imagePickerOptons,
            })
              .then(response => this.appendPhoto(response, i))
              .catch(() => this.closeModalConditional());
            break;
          case 1:
            ImagePicker.openPicker({
              ...imagePickerOptons,
              multiple,
              smartAlbums: [
                'UserLibrary',
                'PhotoStream',
                'Screenshots',
                'Generic',
                'Favorites',
                'RecentlyAdded',
              ],
            })
              .then(response => this.appendPhoto(response, i))
              .catch(() => this.closeModalConditional());
            break;
          default:
            this.closeModalConditional();
            break;
        }
      }
    );
  };

  appendPhoto(response: Array<any> | any, i: number) {
    if (response.length) {
      if (response.length + this.state.images.length > MAX_IMAGES) {
        Toast.fail(I18n.t('add_or_edit_item.too_many_images'));
        return console.debug('too many images');
      }
      for (let j = 0; j < response.length; j++) {
        // starts from i, increments with j
        this.uploadImagesTemporarilyAndAppend(response[j], i + j);
      }
    } else {
      this.uploadImagesTemporarilyAndAppend(response, i);
    }
  }

  onUploadProgress = (progressEvent: any) => {
    const progress = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    // console.log(progress);
    this.setState({ progress });
  };

  async uploadImagesTemporarilyAndAppend(
    response: Array<any> | any,
    i: number
  ) {
    const { token } = this.props;

    this.setState({ isUploading: true, progress: 100 });
    const image = { isUploading: true };

    try {
      this.appendImageOrReplace(image, i);
      const data = await api.uploadTempImage(
        response.path,
        token,
        this.onUploadProgress
      );
      this.appendSinglePhoto(data, i);
    } catch (err) {
      this.removeSinglePhoto(i);
      ui.showToast(err.message || JSON.stringify(err), 'warning', '', 5);
      console.debug(err);
    }
    this.setState({ isUploading: false, progress: 100 });
  }

  appendSinglePhoto(path: string, i: number) {
    const image = {
      url: path,
      id: i,
      isUploading: false,
    };
    this.appendImageOrReplace(image, i);
  }

  removeSinglePhoto = (index: number) =>
    this.setState(prevState => {
      return {
        images: prevState.images.filter((e, i) => i !== index),
      };
    });

  // if we want to replace an existing photo
  appendImageOrReplace = (image: any, i: number) => {
    this.setState(prevState => {
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
  };

  hasUnsavedChanges(): boolean {
    const { description, images, price, tags } = this.state;
    if (
      description.length > 0 ||
      images.length > 0 ||
      price.length > 0 ||
      tags.length > 0
    ) {
      return true;
    }
    return false;
  }

  closeModal = () => {
    this.props.navigation.goBack();
  };

  closeModalConditional = () => {
    // const { inEditMode } = this.state;
    // if (!inEditMode /* && fields.touched() */) {
    // FIXME: check if the changes are different from loading from the API
    if (this.hasUnsavedChanges()) {
      ui.showConfirmAlert(
        I18n.t('profile.alert_unsaved_changes_title'),
        I18n.t('profile.alert_unsaved_changes_body'),
        () => {
          // on continue
          this.closeModal();
        },
        () => {},
        I18n.t('profile.alert_unsaved_changes_button_cancel'),
        I18n.t('profile.alert_unsaved_changes_button_confirm')
      );
    } else {
      this.closeModal();
    }
    // }
  };

  onSave = async ({ price }) => {
    if (!this.isButtonEnabled({ price })) return;

    Toast.loading(I18n.t('alerts.toast_uploading'), 30);
    const {
      description,
      grp_1,
      grp_2,
      images,
      inEditMode,
      tags,
      uuid,
    } = this.state;

    const data: any = {
      categoryIds: grp_1.toString(),
      description: description.trim(),
      photos: images.map(i => i.url),
      price,
      tags: JSON.stringify(tags),
      typeIds: grp_2.toString(),
    };

    try {
      let res;
      if (inEditMode) {
        res = await this.uploadEditedProduct(uuid, data);
      } else {
        this.props.navigation.state.params.returnData(data);
      }
      this.props.dispatch(enableRefresh());
      this.closeModal();
      console.debug(res);
    } catch (err) {
      console.debug(err);
      ui.showToast(err.message, 'warning');
    }
    Toast.hide();
  };

  uploadEditedProduct = (uuid: string, data: any): Promise<any> => {
    const { token } = this.props;
    return api.put(`/api/products/${uuid}`, data, { token, timeout: 30000 });
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
    text = text.toLowerCase();
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

  // numbers only, one dot and 2 decimal points

  isButtonEnabled({ price }): boolean {
    // const tagsPattern = /^(\b[a-z][a-z0-9]*)$/i;

    const { images } = this.state;
    // return true if all of these are true
    return (
      // if all the images have been uploaded
      images.filter((i: any) => i.isUploading === false).length ===
        images.length &&
      // If the price is not empty
      price !== '' &&
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

  onImageChange = (images: Array<any>) => {
    this.setState({ images }, () => this.closeModalConditional());
  };

  onChangeDescription = (t: string) => this.setState({ description: t });

  onInvalidSubmit = (errors: any) => {
    if (errors.price) {
      this.priceInput.focus();
      this.priceControl.markAsTouched();
    }
  };

  render() {
    const {
      description,
      descriptionFocused,
      grp_1,
      grp_2,
      images,
      inEditMode,
      isUploading,
      tags,
      tagsText,
    } = this.state;

    // if (images.length < 1 && !inEditMode) return null;

    return (
      <Foect.Form
        onValidSubmit={this.onSave}
        onInvalidSubmit={this.onInvalidSubmit}>
        {form => (
          <Container>
            <Header>
              <Left style={styles.container}>
                <NBButton transparent onPress={this.closeModalConditional}>
                  <Icon color={colors.black} name="close" size={28} />
                </NBButton>
              </Left>
              <Body style={styles.container}>
                <Title style={{ color: colors.black }}>
                  {inEditMode
                    ? I18n.t('add_or_edit_item.edit_item_header')
                    : I18n.t('add_or_edit_item.add_item_header')}
                </Title>
              </Body>
              <Right>
                <NBButton
                  testID="saveButton"
                  transparent
                  // disabled={!this.isButtonEnabled()}
                  style={{ backgroundColor: colors.transparent }}
                  onPress={() => form.submit()}>
                  <Icon name="check" color={colors.black} size={28} />
                </NBButton>
              </Right>
            </Header>
            <Content>
              <View
                style={{
                  alignItems: 'flex-start',
                  marginLeft: 17,
                  paddingTop: 18,
                  height: width / 6 + 10,
                }}>
                <AntImagePicker
                  files={images}
                  onImageClick={i => this.selectPhotoTapped(i, false)}
                  onAddImageClick={() => this.selectPhotoTapped(images.length)}
                  selectable={images.length < 6}
                  enabled={!isUploading}
                  onChange={this.onImageChange}
                  onChangeOrder={array => {
                    const order = array.map(e => parseInt(e));
                    const newOrder = [];
                    for (let i = 0; i < order.length; i++) {
                      const o = order[i];
                      newOrder.push(this.state.images[o]);
                    }
                    this.setState({ images: newOrder });
                  }}
                />
              </View>
              <View>
                <FormLabel labelStyle={styles.label}>
                  {I18n.t('add_or_edit_item.price_label')}
                </FormLabel>
                <Foect.Control
                  name="price"
                  required
                  maxLength={8}
                  checkPrice={{}}>
                  {/* you can use control for getting/setting it's value, checking/updating(control.isValid, control.markAsTouched(), ...) it's state, checking it's errors(control.errors.required) */}
                  {control => {
                    this.priceControl = control;
                    return (
                      <View style={{ paddingLeft: 6 }}>
                        <InputItem
                          testID="price"
                          ref={input => (this.priceInput = input)}
                          autoCorrect={false}
                          clearButtonMode="while-editing"
                          error={control.isTouched && control.isInvalid}
                          // onErrorClick={ show toast with }
                          last
                          onBlur={control.markAsTouched}
                          onChange={v => {
                            settings.PRICE_REGEX.test(v) && control.onChange(v);
                          }}
                          placeholder={I18n.t(
                            'add_or_edit_item.price_placeholder'
                          )}
                          type="number"
                          value={control.value}
                        />
                        {control.isTouched &&
                          control.isInvalid && (
                            <Text style={styles.minPrice}>
                              {`${I18n.t('add_or_edit_item.min_price')} ${
                                settings.MIN_PRICE
                              } UAH`}
                            </Text>
                          )}
                      </View>
                    );
                  }}
                </Foect.Control>
                <FormLabel labelStyle={styles.label}>
                  {I18n.t('add_or_edit_item.description_label')}
                </FormLabel>
                <TextareaItem
                  testID="description"
                  style={styles.inputContainerNew}
                  last // to set borderBottomWidth=0
                  containerStyle={{ borderBottomWidth: 5, marginRight: 12 }}
                  rows={3}
                  count={settings.MAX_LENGTH_DESCRIPTION}
                  onChangeText={this.onChangeDescription}
                  onFocus={() => this.setState({ descriptionFocused: true })}
                  placeholder={I18n.t(
                    'add_or_edit_item.description_placeholder'
                  )}
                  value={description}
                  error={
                    descriptionFocused &&
                    description.trim().length < settings.MIN_LENGTH_DESCRIPTION
                  }
                />
                <FormLabel labelStyle={styles.label}>
                  {I18n.t('add_or_edit_item.hashtags_label')}
                </FormLabel>
                <TagInput
                  inputDefaultWidth={140}
                  maxHeight={2000}
                  labelExtractor={tag => tag}
                  onChange={this.changeTags}
                  onChangeText={this.changeTagsTest}
                  tagColor={colors.primary}
                  tagTextColor="white"
                  text={tagsText}
                  value={tags}
                  inputProps={{
                    placeholder:
                      tags.length < 1
                        ? I18n.t('add_or_edit_item.hashtags_placeholder')
                        : '',
                  }}
                />
              </View>
              <View style={styles.grps}>
                <RadioForm animation formHorizontal>
                  {ui.category_radio_grp_1.map((option, i) => (
                    <RadioButton labelHorizontal={false} key={i}>
                      <RadioButtonLabel
                        index={i}
                        labelHorizontal
                        labelStyle={styles.radioButtonLabel}
                        obj={option}
                        onPress={grp_1 => this.setState({ grp_1 })}
                      />
                      <RadioButtonInput
                        testID={`grp_1_input_${i}`}
                        borderWidth={2}
                        buttonInnerColor={colors.black}
                        buttonOuterColor={colors.black}
                        buttonOuterSize={19}
                        buttonSize={19}
                        buttonWrapStyle={styles.radioButtonInput}
                        index={i}
                        isSelected={grp_1 === i}
                        obj={option}
                        onPress={grp_1 => this.setState({ grp_1 })}
                      />
                    </RadioButton>
                  ))}
                </RadioForm>
              </View>
              <HR color={colors.grey5} />
              <View style={[styles.grps, { marginBottom: 20 }]}>
                <RadioForm animation formHorizontal>
                  {ui.category_radio_grp_2.map((option, i) => (
                    <RadioButton labelHorizontal={false} key={i}>
                      <RadioButtonLabel
                        index={i}
                        labelHorizontal
                        labelStyle={styles.radioButtonLabel}
                        obj={option}
                        onPress={grp_2 => this.setState({ grp_2 })}
                      />
                      <RadioButtonInput
                        testID={`grp_2_input_${i}`}
                        borderWidth={2}
                        buttonInnerColor={colors.black}
                        buttonOuterColor={colors.black}
                        buttonOuterSize={19}
                        buttonSize={19}
                        buttonWrapStyle={styles.radioButtonInput}
                        index={i}
                        isSelected={grp_2 == i}
                        obj={option}
                        onPress={grp_2 => this.setState({ grp_2 })}
                      />
                    </RadioButton>
                  ))}
                </RadioForm>
              </View>
            </Content>
          </Container>
        )}
      </Foect.Form>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    color: colors.black,
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
  minPrice: {
    color: colors.red,
    paddingLeft: 12,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  token: state.LoginReducer.token,
});

export const AddOrEditProduct = connect(mapStateToProps)(
  AddOrEditProductScreen
);

Foect.Validators.add('checkPrice', (val: any) => {
  if (!val) return null;

  if (parseFloat(val) < settings.MIN_PRICE) {
    return { checkPrice: true };
  } else return null;
});
