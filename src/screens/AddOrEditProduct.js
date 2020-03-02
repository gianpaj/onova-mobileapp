// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Dimensions, Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ActionSheet, Body, Button as NBButton, Container, Content, Left, Right } from 'native-base';
import { FormLabel } from 'react-native-elements';
import ImagePicker from 'react-native-image-crop-picker';
import { InputItem, TextareaItem, Toast } from 'antd-mobile-rn';
import Foect from 'foect';
import Dialog from 'react-native-dialog';
import { APP_NAME } from 'react-native-dotenv';

import { ImagePicker as AntImagePicker, Header, Info, TagInput, Title } from '../components';
import RadioForm, { RadioButton, RadioButtonInput, RadioButtonLabel } from '../components/SimpleRadioButton';
import { enableRefresh } from '../actions/actionCreator';
import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { Dispatch, ReduxState } from '../types';

import type { NavigationScreenProp } from 'react-navigation';
const { width } = Dimensions.get('window');

const brands = require('../assets/brands.json');

const MIN_WIDTH = 1000;
const MIN_HEIGHT = 1000;
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
const GALLERY =
  Platform.OS == 'ios'
    ? I18n.t('add_or_edit_item.select_photo_source_gallery_ios')
    : I18n.t('add_or_edit_item.select_photo_source_gallery_android');

const CANCEL = I18n.t('add_or_edit_item.select_photo_source_cancel');

export type Image = {
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
  dialogInfoVisible: boolean,
  dialogPriceVisible: boolean,
  grp_1: number,
  images: Array<Image>,
  inEditMode: boolean,
  isLoading: boolean,
  isUploading: boolean,
  order: Array<number>,
  pending: boolean,
  price: string,
  progress: number,
  quantity: number,
  tags: Array<string>,
  tagsText: string,
  uuid: string,
};

let inEditMode = false;

export class AddOrEditProductScreen extends React.Component<Props, State> {
  priceControl;
  priceInput;
  descriptionControl;
  grp_1;
  numberOfBrands = 0;

  state = {
    dialogInfoVisible: false,
    dialogPriceVisible: false,
    description: '',
    grp_1: -1,
    images: [],
    inEditMode: false,
    isLoading: true,
    isUploading: false,
    order: [],
    pending: false,
    price: '',
    progress: 0,
    quantity: '1',
    tags: [],
    tagsText: '',
    uuid: '',
  };

  async componentDidMount() {
    // $FlowFixMe
    let { params } = this.props.navigation.state;

    // for development
    // params = { item: { uuid: '5k_CnnlcF' } };

    // edit mode
    if (params && params.item) {
      this.setState({ inEditMode: true });
      inEditMode = true;
      try {
        const item = await api.getProduct(params.item.uuid);
        // console.warn(item);
        let images = [];
        for (let i = 0; i < item.photoURIs.length; i++) {
          images.push({
            url: item.photoURIs[i],
            id: i,
            isUploading: false,
          });
        }
        return this.setState({
          description: item.description,
          grp_1: item.categoryIds[0],
          images,
          isLoading: false,
          price: item.price,
          quantity: item.quantity.toString(),
          tags: item.tags,
          uuid: item.uuid,
        });
      } catch (error) {
        console.error(error);
      }
    }
    inEditMode = false;
    // adding a new item
    this.setState({ isLoading: false });
    this.selectPhotoTapped(0);
  }

  componentWillUnmount() {
    // TODO: cancel all uploads
  }

  selectPhotoTapped = (i: number = 0) => {
    // development
    // this.appendSinglePhoto('https://storage.googleapis.com/assets.onova.co/products/MS8mGgiHPi-1-1542904777176.jpg', Math.round(1+Math.random() * 100));
    // this.appendSinglePhoto(
    //   'https://storage.googleapis.com/assets.onova.co/products/saxBKnrTO-1-1542904778726.jpg',
    //   Math.round(2 + Math.random() * 100)
    // );
    // return this.appendSinglePhoto(
    //   'https://storage.googleapis.com/assets.onova.co/products/e3X8Z2hehL-1-1542904778086.jpg',
    //   Math.round(7 + Math.random() * 100)
    // );
    if (global.__TESTING__) {
      return ImagePicker.openPicker()
        .then(() => {
          const url = 'https://storage.googleapis.com/temp-uploads.onova.co/1537607915827.jpg';
          // const url = 'https://placekitten.com/g/1440/1440';
          this.appendSinglePhoto(url, i);
        })
        .catch(() => this.goBackConditional());
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
            ImagePicker.openCamera({ ...imagePickerOptons })
              .then(response => this.appendPhotos(response, i))
              .catch(e => e.code && e.code !== 'E_PICKER_CANCELLED' && this.goBackConditional());
            break;
          case 1:
            ImagePicker.openPicker({
              ...imagePickerOptons,
              multiple: true,
              smartAlbums: ['UserLibrary', 'PhotoStream', 'Screenshots', 'Generic', 'Favorites', 'RecentlyAdded'],
            })
              .then(response => this.appendPhotos(response, i))
              .catch(e => e.code && e.code !== 'E_PICKER_CANCELLED' && this.goBackConditional());
            break;
          default:
            break;
        }
      }
    );
  };

  async appendPhotos(response: Array<any> | any, i: number) {
    if (response.length && response.length + this.state.images.length > MAX_IMAGES) {
      Toast.fail(I18n.t('add_or_edit_item.too_many_images'));
      return console.debug('too many images');
    }
    try {
      this.setState({ isUploading: true });

      if (response.length) {
        for (let j = 0; j < response.length; j++) {
          this.appendImageOrReplace({ isUploading: true }, i + j);
        }
        this.forceUpdate();
        for (let j = 0; j < response.length; j++) {
          await this.uploadImageTemporarilyAndAppend(response[j], i + j);
        }
      } else {
        // one image (from camera)
        this.appendImageOrReplace({ isUploading: true }, i);
        this.forceUpdate();
        await this.uploadImageTemporarilyAndAppend(response, i);
      }
    } catch (error) {
      console.error(error);

      ui.showToast(error.message || JSON.stringify(error), 'warning', '', 5);
    }
    this.setState({ isUploading: false });
  }

  /*
  onUploadProgress = (progressEvent: any) => {
    const progress = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    this.setState({ progress });
  };
  */

  async uploadImageTemporarilyAndAppend(response: any, i: number) {
    const { token } = this.props;

    try {
      if (response.width < MIN_WIDTH || response.height < MIN_HEIGHT) {
        throw new Error(I18n.t('add_or_edit_item.image_too_small', { MIN_WIDTH, ...response }));
      }
      // this.appendImageOrReplace({ isUploading: true }, i);
      // this.forceUpdate();

      const data = await api.uploadTempImage(
        response.path,
        token
        // this.onUploadProgress
      );
      this.appendSinglePhoto(data, i);
    } catch (err) {
      this.removeSinglePhoto(i);
      ui.showToast(typeof err.message == 'string' ? err.message : JSON.stringify(err), 'warning', '', 5);
      console.error(err);
    }
  }

  appendSinglePhoto(path: string, i: number) {
    this.appendImageOrReplace(
      {
        url: path,
        id: i,
        isUploading: false,
      },
      i
    );
  }

  removeSinglePhoto = (index: number) =>
    this.setState(prevState => ({
      images: prevState.images.filter((e, i) => i !== index),
    }));

  // add or replace an existing photo
  appendImageOrReplace = (image: any, i: number) => {
    this.setState(prevState => {
      const copy = [...prevState.images];
      if (prevState.images[i]) {
        copy[i] = image;
        return { images: copy };
      }

      return { images: [...copy, image] };
    });
  };

  // FIXME: check changes properly if inEditMode
  hasUnsavedChanges(): boolean {
    const { images, tags } = this.state;
    const description = this.descriptionControl.value;
    const price = this.priceControl.value;
    return description.length > 0 || images.length > 0 || price.length > 0 || tags.length > 0;
  }

  goBack = () => this.props.navigation.goBack();

  goBackConditional = () => {
    // const { inEditMode } = this.state;
    // if (!inEditMode /* && fields.touched() */) {
    // FIXME: check if the changes are different from loading from the API
    if (!this.hasUnsavedChanges()) {
      return this.goBack();
    }
    ui.showConfirmAlert(
      I18n.t('profile.alert_unsaved_changes_title'),
      I18n.t('profile.alert_unsaved_changes_body'),
      () => this.goBack(), // on continue
      () => {},
      I18n.t('profile.alert_unsaved_changes_button_cancel'),
      I18n.t('profile.alert_unsaved_changes_button_confirm')
    );
  };

  onSave = async ({
    price,
    description,
    grp_1,
    quantity,
  }: {
    price: string,
    description: string,
    grp_1: number,
    quantity: string,
  }) => {
    if (!this.canSave({ price, description, grp_1, quantity })) return;

    this.setState({ pending: true });

    if (this.state.tagsText.length) {
      await this.changeTagsTest(this.state.tagsText + ',');
    }

    Toast.loading(I18n.t('alerts.toast_uploading'), 30);
    const { images, inEditMode, tags, uuid } = this.state;

    const data: any = {
      categoryIds: grp_1.toString(),
      description: description.trim(),
      photos: images.map(i => i.url),
      price,
      quantity: parseInt(quantity),
      tags: JSON.stringify(tags),
    };

    try {
      if (inEditMode) {
        const res = await this.uploadEditedProduct(uuid, data);
        console.debug(res);
      } else {
        // return the data to the CreateDrop screen
        this.props.navigation.state.params.returnData(data);
      }
      this.props.dispatch(enableRefresh());
      this.goBack();
    } catch (err) {
      console.debug(err);
      if (err.message == 'Invalid product tag') {
        ui.showToast(I18n.t('add_or_edit_item.alert_invalid_hashtag'), 'warning');
      } else {
        ui.showToast(err.message, 'warning');
      }
      this.setState({ pending: false });
    }
    Toast.hide();
  };

  uploadEditedProduct = (uuid: string, data: any): Promise<any> =>
    api.put(`/api/products/${uuid}`, data, {
      token: this.props.token,
      timeout: 30000,
    });

  /**
   * triggers only when a tag is deleted
   */
  changeTags = (tags: Array<string>) => {
    // if there no are any brands in the hashtags
    const found = this.state.tags.some(r => brands.brands.indexOf(r) >= 0);
    if (!found) this.numberOfBrands = 0;

    this.setState({ tags });
  };

  changeTagsTest = (tagsText: string): Promise<void> => {
    return new Promise(resolve => {
      // text has multiple spaces
      const textHasBeenPasted = tagsText.split(' ').filter(s => Boolean(s)).length > 1;
      if (textHasBeenPasted) {
        const onBrandTags = tagsText
          .split(' ')
          .filter(
            s =>
              Boolean(s) &&
              settings.HASHTAG_REGEX.test(s) &&
              s.length < settings.MAX_LENGTH_PER_TAG &&
              this.onlyOneBrand(s)
          );
        const uniqueTags = new Set([...this.state.tags, ...onBrandTags]);
        return this.setState(
          {
            tags: Array.from(uniqueTags).slice(0, settings.MAX_TAGS),
            tagsText: '',
          },
          () => resolve()
        );
      }

      const textWithoutSeparators = tagsText.replace(/,|;| | \n/gi, '');
      // if the tag is longer the maximum
      // OR if it doesn't match the regex
      if (
        textWithoutSeparators.length > settings.MAX_LENGTH_PER_TAG ||
        !settings.HASHTAG_REGEX.test(textWithoutSeparators)
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
        return this.setState(
          {
            tags: Array.from(newTags),
            tagsText: '',
          },
          () => resolve()
        );
      }
      this.setState({ tagsText: textWithoutSeparators }, () => resolve());
    });
  };

  /**
   * if a brand is typed, allow only one to be added
   */
  onlyOneBrand(text: string): boolean {
    text = text.toLowerCase();
    if (brands.brands.indexOf(text) == -1) return true;
    if (brands.brands.indexOf(text) > -1 && this.numberOfBrands < settings.MAX_BRAND_TAGS) {
      this.numberOfBrands++;
      return true;
    }
    return false;
  }

  // numbers only, one dot and 2 decimal points
  canSave({
    price,
    description,
    grp_1,
    quantity,
  }: {
    price: string,
    description: string,
    grp_1: number,
    quantity: string,
  }): boolean {
    // const tagsPattern = /^(\b[a-z][a-z0-9]*)$/i;

    const { inEditMode, images, pending, tags } = this.state;
    // return true if all of these are true
    return (
      !pending &&
      images.length > 0 &&
      // if all the images have been uploaded
      images.filter((i: any) => i.isUploading === false).length === images.length &&
      // if the price is not empty
      price !== '' &&
      // if the description doesn't exceed the maximum length
      description.trim().length >= settings.MIN_LENGTH_DESCRIPTION &&
      // if there's the minimum required of tags
      tags.length >= settings.MIN_TAGS &&
      // if there's an product category selected
      grp_1 > -1 &&
      parseInt(quantity) > (inEditMode ? -1 : 0) &&
      parseInt(quantity) <= 99
    );
  }

  onImageChange = (images: Array<any>) => this.setState({ images });

  onImageChangeOrder = (rowKey, order: Array<Number>) => {
    const newOrder = [];
    for (let i = 0; i < order.length; i++) {
      const o = parseInt(order[i]);
      newOrder.push(this.state.images[o]);
    }
    this.setState({ images: newOrder });
  };

  onInvalidSubmit = (errors: any) => {
    if (Object.keys(errors.price).length) {
      this.priceInput.focus();
      this.priceControl.markAsTouched();
    }
    if (Object.keys(errors.description).length) {
      this.descriptionControl.markAsTouched();
    }
    if (Object.keys(errors.grp_1).length) {
      this.grp_1.markAsTouched();
    }
  };

  render() {
    const {
      description,
      grp_1,
      images,
      inEditMode,
      isLoading,
      isUploading,
      price,
      quantity,
      tags,
      tagsText,
    } = this.state;

    if (isLoading) return null;

    return (
      <React.Fragment>
        <Foect.Form
          onValidSubmit={this.onSave}
          defaultValue={{ description, price, grp_1, quantity }}
          onInvalidSubmit={this.onInvalidSubmit}>
          {form => (
            <Container>
              <Header>
                <Left style={styles.container}>
                  <NBButton transparent onPress={this.goBackConditional}>
                    <MaterialIcons color={colors.black} name="close" size={28} />
                  </NBButton>
                </Left>
                <Body style={styles.flex2AndCenter}>
                  <Title withIcon>
                    {inEditMode
                      ? I18n.t('add_or_edit_item.edit_item_header')
                      : I18n.t('add_or_edit_item.add_item_header')}
                  </Title>
                  <Info onPress={this.toggleInfoDialog} />
                </Body>
                <Right>
                  <NBButton
                    testID="saveButton"
                    transparent
                    style={{ backgroundColor: colors.transparent }}
                    onPress={() => form.submit()}>
                    <MaterialIcons name="check" color={colors.black} size={28} />
                  </NBButton>
                </Right>
              </Header>
              <Content>
                <View style={styles.body}>
                  <AntImagePicker
                    files={images}
                    onImageClick={index => {
                      !images[index].isUploading && this.selectPhotoTapped(index);
                    }}
                    onAddImageClick={this.selectPhotoTapped}
                    selectable={images.length < 6}
                    imagePerRow={6}
                    enabled={!isUploading}
                    onChange={this.onImageChange}
                    onChangeOrder={this.onImageChangeOrder}
                  />
                </View>
                <React.Fragment>
                  <View
                    style={{
                      alignItems: 'baseline',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <FormLabel labelStyle={styles.label}>{I18n.t('add_or_edit_item.price_label')}</FormLabel>
                    <TouchableOpacity
                      hitSlop={{ top: 10, left: 5, bottom: 5, right: 10 }}
                      style={{ marginRight: 17 }}
                      onPress={this.togglePriceDialog}>
                      <Text>{I18n.t('add_or_edit_item.price_info')}</Text>
                    </TouchableOpacity>
                  </View>
                  <Foect.Control name="price" required maxLength={8} checkPrice={{}}>
                    {control => {
                      this.priceControl = control;
                      return (
                        <View style={{ paddingLeft: 6 }}>
                          <InputItem
                            testID="price"
                            ref={input => (this.priceInput = input)}
                            autoCorrect={false}
                            blurOnSubmit={false}
                            clearButtonMode="while-editing"
                            error={control.isTouched && control.isInvalid}
                            // onErrorClick={ show toast with }
                            last
                            onBlur={control.markAsTouched}
                            onChange={v => {
                              settings.PRICE_REGEX.test(v) && control.onChange(v);
                            }}
                            placeholder={I18n.t('add_or_edit_item.price_placeholder')}
                            returnKeyType="go"
                            type="number"
                            value={control.value}
                          />
                          {control.isTouched && (control.errors.required || control.errors.checkPrice) && (
                            <Text style={styles.minError}>
                              {`${I18n.t('add_or_edit_item.min_price')} ${settings.MIN_PRICE} UAH`}
                            </Text>
                          )}
                        </View>
                      );
                    }}
                  </Foect.Control>
                  <FormLabel labelStyle={styles.label}>{I18n.t('add_or_edit_item.quantity_label')}</FormLabel>
                  <Foect.Control name="quantity" required checkQuantity={{}}>
                    {control => (
                      <View style={{ paddingLeft: 6 }}>
                        <InputItem
                          autoCorrect={false}
                          blurOnSubmit={false}
                          clearButtonMode="while-editing"
                          error={control.isTouched && control.isInvalid}
                          // onErrorClick={ show toast with }
                          last
                          onBlur={control.markAsTouched}
                          onChange={control.onChange}
                          returnKeyType="go"
                          type="number"
                          value={control.value}
                        />
                        {control.isTouched && control.errors.required && (
                          <Text style={styles.minError}>{`${I18n.t('add_or_edit_item.min_quantity')} ${
                            inEditMode ? 0 : 1
                          }`}</Text>
                        )}
                      </View>
                    )}
                  </Foect.Control>
                  <FormLabel labelStyle={styles.label}>{I18n.t('add_or_edit_item.description_label')}</FormLabel>
                  <Foect.Control
                    name="description"
                    required
                    minLength={settings.MIN_LENGTH_DESCRIPTION}
                    maxLength={settings.MAX_LENGTH_DESCRIPTION}>
                    {control => {
                      this.descriptionControl = control;
                      return (
                        <TextareaItem
                          testID="description"
                          error={control.isTouched && control.isInvalid}
                          last // to set borderBottomWidth=0
                          containerStyle={{
                            borderBottomWidth: 5,
                            marginRight: 12,
                          }}
                          count={settings.MAX_LENGTH_DESCRIPTION}
                          onBlur={control.markAsTouched}
                          onChangeText={control.onChange.bind(this)}
                          rows={3}
                          style={styles.inputContainerNew}
                          placeholder={I18n.t(`add_or_edit_item.description_placeholder_${APP_NAME}`)}
                          value={control.value}
                        />
                      );
                    }}
                  </Foect.Control>
                  <FormLabel labelStyle={styles.label}>{I18n.t('add_or_edit_item.hashtags_label')}</FormLabel>
                  <TagInput
                    inputDefaultWidth={140}
                    labelExtractor={tag => tag}
                    maxHeight={2000}
                    onChange={this.changeTags}
                    onChangeText={this.changeTagsTest}
                    onBlur={() => this.changeTagsTest(this.state.tagsText + ',')}
                    tagColor={colors.primary}
                    tagTextColor="white"
                    text={tagsText}
                    value={tags}
                    inputProps={{
                      placeholder: tags.length < 1 ? I18n.t('add_or_edit_item.hashtags_placeholder') : '',
                    }}
                  />
                </React.Fragment>
                <>
                  <Foect.Control name="grp_1" required pattern={/^\d+$/}>
                    {control => {
                      this.grp_1 = control;
                      if (APP_NAME == 'onova') {
                        return (
                          <RadioForm animation formHorizontal>
                            {ui.category_radio_grp_1.map((option, i) => (
                              <RadioButton labelHorizontal={false} key={i}>
                                <RadioButtonLabel
                                  index={i}
                                  labelStyle={styles.radioButtonLabel}
                                  obj={option}
                                  onPress={control.onChange}
                                />
                                {/* // FIXME: issue in foect library? */}
                                <RadioButtonInput {...RadioButtonInputProps(control, option)} index={i} />
                              </RadioButton>
                            ))}
                          </RadioForm>
                        );
                      }
                      return (
                        <>
                          <View style={styles.grps}>
                            <RadioForm animation formHorizontal>
                              {ui.category_radio_grp_1
                                .filter((_, i) => i < 2)
                                .map((option, i) => (
                                  <RadioButton labelHorizontal={false} key={i}>
                                    <RadioButtonLabel
                                      index={i}
                                      labelStyle={styles.radioButtonLabel}
                                      obj={option}
                                      onPress={control.onChange}
                                    />
                                    {/* // FIXME: issue in foect library? */}
                                    <RadioButtonInput {...RadioButtonInputProps(control, option)} index={i} />
                                  </RadioButton>
                                ))}
                            </RadioForm>
                          </View>
                          <View style={styles.grps}>
                            <RadioForm animation formHorizontal style={{ marginTop: 20 }}>
                              {ui.category_radio_grp_1
                                .filter((_, i) => i > 1 && i < 4)
                                .map((option, i) => (
                                  <RadioButton labelHorizontal={false} key={i}>
                                    <RadioButtonLabel
                                      index={i}
                                      labelStyle={styles.radioButtonLabel}
                                      obj={option}
                                      onPress={control.onChange}
                                    />
                                    <RadioButtonInput {...RadioButtonInputProps(control, option)} index={i} />
                                  </RadioButton>
                                ))}
                            </RadioForm>
                          </View>
                          <View style={styles.grps}>
                            <RadioForm animation formHorizontal style={{ marginTop: 20 }}>
                              {ui.category_radio_grp_1
                                .filter((_, i) => i > 3)
                                .map((option, i) => (
                                  <RadioButton labelHorizontal={false} key={i}>
                                    <RadioButtonLabel
                                      index={i}
                                      labelStyle={styles.radioButtonLabel}
                                      obj={option}
                                      onPress={control.onChange}
                                    />
                                    <RadioButtonInput {...RadioButtonInputProps(control, option)} index={i} />
                                  </RadioButton>
                                ))}
                            </RadioForm>
                          </View>
                        </>
                      );
                    }}
                  </Foect.Control>
                </>
              </Content>
            </Container>
          )}
        </Foect.Form>
        {this.renderInfoDialog()}
        {this.renderPriceDialog()}
      </React.Fragment>
    );
  }

  toggleInfoDialog = () => this.setState(prevState => ({ dialogInfoVisible: !prevState.dialogInfoVisible }));

  togglePriceDialog = () => this.setState(prevState => ({ dialogPriceVisible: !prevState.dialogPriceVisible }));

  renderInfoDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.dialogInfoVisible}
        onBackdropPress={this.toggleInfoDialog}
        onBackButtonPress={this.toggleInfoDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Description style={{ textAlign: 'justify' }}>
          {I18n.t('add_or_edit_item.info_popup')}
        </Dialog.Description>
        <Dialog.Button label={I18n.t('product.toast_warning_ok_button')} onPress={this.toggleInfoDialog} />
      </Dialog.Container>
    </React.Fragment>
  );

  renderPriceDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.dialogPriceVisible}
        onBackdropPress={this.togglePriceDialog}
        onBackButtonPress={this.togglePriceDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Title>{I18n.t('add_or_edit_item.price_popup_title')}</Dialog.Title>
        <Dialog.Description style={{ textAlign: 'justify' }}>
          {I18n.t('add_or_edit_item.price_popup_body')}
        </Dialog.Description>
        <Dialog.Button label={I18n.t('product.toast_warning_ok_button')} onPress={this.togglePriceDialog} />
      </Dialog.Container>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'flex-start',
    height: width / 6 + 10,
    marginHorizontal: 17,
    paddingTop: 18,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  flex2AndCenter: {
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  grps: {
    alignItems: 'center',
    justifyContent: 'center',
    // left: -7,
    width: '100%',
  },
  inputContainerNew: {
    backgroundColor: colors.transparent,
    marginBottom: 28,
    marginHorizontal: 12,
    marginTop: 0,
  },
  label: {
    color: colors.black,
    fontWeight: '600',
  },
  minError: {
    color: colors.red,
    paddingLeft: 12,
  },
  radioButtonInput: {
    width: APP_NAME == 'drop' ? 162 : 90,
  },
  radioButtonLabel: {
    color: colors.grey1,
    marginBottom: 10,
    paddingLeft: 0,
  },
});

const RadioButtonInputProps = (control, option) => ({
  borderWidth: 2,
  buttonInnerColor: colors.black,
  buttonOuterColor: control.isTouched && control.isInvalid ? colors.red : colors.black,
  buttonOuterSize: 19,
  buttonSize: 19,
  buttonWrapStyle: styles.radioButtonInput,
  isSelected: control.value == option.value,
  obj: option,
  onPress: control.onChange,
});

const mapStateToProps: any = (state: ReduxState) => ({
  token: state.LoginReducer.token,
});

export const AddOrEditProduct = connect(mapStateToProps)(AddOrEditProductScreen);

Foect.Validators.add('checkPrice', (val: any) => {
  if (!val) return null; // valid

  if (parseFloat(val) < settings.MIN_PRICE) {
    // error
    return { checkPrice: true };
    // valid
  } else return null;
});

Foect.Validators.add('checkQuantity', (val: any) => {
  if (!val) return null; // valid

  if (isNaN(val) || parseInt(val) < (inEditMode ? 0 : 1) || parseInt(val) > 99) {
    // error
    return { checkQuantity: true };
    // valid
  } else return null;
});
