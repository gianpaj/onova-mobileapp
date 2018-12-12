// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
import Dialog from 'react-native-dialog';

import {
  ImagePicker as AntImagePicker,
  Header,
  HR,
  TagInput,
} from '../components';
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

const MIN_WIDTH = 1440;
const MIN_HEIGHT = 1440;
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
  dialogInfoVisible: boolean,
  dialogPriceVisible: boolean,
  description: string,
  grp_1: number,
  grp_2: number,
  images: Array<Image>,
  inEditMode: boolean,
  isLoading: boolean,
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
  priceInput;
  descriptionControl;

  state = {
    dialogInfoVisible: false,
    dialogPriceVisible: false,
    description: '',
    grp_1: -1,
    grp_2: -1,
    images: [],
    inEditMode: false,
    isLoading: true,
    isUploading: false,
    numberOfBrands: 0,
    order: [],
    pending: false,
    price: '',
    progress: 0,
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
          grp_2: item.typeIds[0],
          images,
          isLoading: false,
          price: item.price,
          tags: item.tags,
          uuid: item.uuid,
        });
      } catch (error) {
        console.error(error);
      }
    }
    // adding a new item
    this.setState({ isLoading: false });
    this.selectPhotoTapped(0);
  }

  componentWillUnmount() {
    // TODO: cancel all uploads
  }

  selectPhotoTapped = (i: number = 0) => {
    // development
    // this.appendSinglePhoto(
    //   'https://storage.googleapis.com/assets.onova.co/products/MS8mGgiHPi-1-1542904777176.jpg',
    //   0
    // );
    // this.appendSinglePhoto(
    //   'https://storage.googleapis.com/assets.onova.co/products/saxBKnrTO-1-1542904778726.jpg',
    //   1
    // );
    // return this.appendSinglePhoto(
    //   'https://storage.googleapis.com/assets.onova.co/products/e3X8Z2hehL-1-1542904778086.jpg',
    //   2
    // );
    if (global.__TESTING__) {
      return ImagePicker.openPicker()
        .then(() => {
          const url =
            'https://storage.googleapis.com/temp-uploads.onova.co/1537607915827.jpg';
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
              .catch(() => this.goBackConditional());
            break;
          case 1:
            ImagePicker.openPicker({
              ...imagePickerOptons,
              multiple: true,
              smartAlbums: [
                'UserLibrary',
                'PhotoStream',
                'Screenshots',
                'Generic',
                'Favorites',
                'RecentlyAdded',
              ],
            })
              .then(response => this.appendPhotos(response, i))
              .catch(() => this.goBackConditional());
            break;
          default:
            break;
        }
      }
    );
  };

  async appendPhotos(response: Array<any> | any, i: number) {
    if (
      response.length &&
      response.length + this.state.images.length > MAX_IMAGES
    ) {
      Toast.fail(I18n.t('add_or_edit_item.too_many_images'));
      return console.debug('too many images');
    }
    try {
      this.setState({ isUploading: true });

      if (response.length) {
        // starts from i, increments with j
        // await Promise.all(
        //   response.map((image, j) =>
        //     this.uploadImageTemporarilyAndAppend(image, i + j)
        //   )
        // );
        for (let j = 0; j < response.length; j++) {
          this.appendImageOrReplace({ isUploading: true }, j);
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
      console.log(error);

      ui.showToast(err.message || JSON.stringify(err), 'warning', '', 5);
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

  async uploadImageTemporarilyAndAppend(response: Array<any> | any, i: number) {
    const { token } = this.props;

    try {
      if (response.width < MIN_WIDTH || response.height < MIN_HEIGHT) {
        throw new Error(
          I18n.t('add_or_edit_item.image_too_small', { MIN_WIDTH, ...response })
        );
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
      ui.showToast(err.message || JSON.stringify(err), 'warning', '', 5);
      console.debug(err);
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
      if (prevState.images[i]) {
        const copy = [...prevState.images];
        copy[i] = image;
        return { images: copy };
      }

      return { images: [...prevState.images, image] };
    });
  };

  // FIXME: check changes properly if inEditMode
  hasUnsavedChanges(): boolean {
    const { images, tags } = this.state;
    const description = this.descriptionControl.value;
    const price = this.priceControl.value;
    return (
      description.length > 0 ||
      images.length > 0 ||
      price.length > 0 ||
      tags.length > 0
    );
  }

  goBack = () => this.props.navigation.goBack();

  goBackConditional = () => {
    // const { inEditMode } = this.state;
    // if (!inEditMode /* && fields.touched() */) {
    // FIXME: check if the changes are different from loading from the API
    if (this.hasUnsavedChanges()) {
      ui.showConfirmAlert(
        I18n.t('profile.alert_unsaved_changes_title'),
        I18n.t('profile.alert_unsaved_changes_body'),
        () => {
          // on continue
          this.goBack();
        },
        () => {},
        I18n.t('profile.alert_unsaved_changes_button_cancel'),
        I18n.t('profile.alert_unsaved_changes_button_confirm')
      );
    } else {
      this.goBack();
    }
    // }
  };

  onSave = async ({ price, description }) => {
    if (!this.canSave({ price, description })) return;

    this.setState({ pending: true });

    if (this.state.tagsText.length) {
      await this.changeTagsTest(this.state.tagsText + ',');
    }

    Toast.loading(I18n.t('alerts.toast_uploading'), 30);
    const { grp_1, grp_2, images, inEditMode, tags, uuid } = this.state;

    const data: any = {
      categoryIds: grp_1.toString(),
      description: description.trim(),
      photos: images.map(i => i.url),
      price,
      tags: JSON.stringify(tags),
      typeIds: grp_2.toString(),
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
      ui.showToast(err.message, 'warning');
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
    if (!found) this.setState({ numberOfBrands: 0 });

    this.setState({ tags });
  };

  changeTagsTest = (tagsText: string) => {
    return new Promise(resolve => {
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

  canSave({ price, description }): boolean {
    // const tagsPattern = /^(\b[a-z][a-z0-9]*)$/i;

    const { images, pending } = this.state;
    // return true if all of these are true
    return (
      !pending &&
      images.length > 0 &&
      // if all the images have been uploaded
      images.filter((i: any) => i.isUploading === false).length ===
        images.length &&
      // if the price is not empty
      price !== '' &&
      // if the description doesn't exceed the maximum length
      description.trim().length >= settings.MIN_LENGTH_DESCRIPTION &&
      // if there's the minimum required of tags
      this.state.tags.length >= settings.MIN_TAGS &&
      // if there's a clothing category selected
      this.state.grp_1 > -1 &&
      // if there's a clothing type selected
      this.state.grp_2 > -1
    );
  }

  onImageChange = (images: Array<any>) => this.setState({ images });

  onImageChangeOrder = (array: Array<any>) => {
    // TODO: use a single map function
    const order = array.map(e => parseInt(e));
    const newOrder = [];
    for (let i = 0; i < order.length; i++) {
      const o = order[i];
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
  };

  render() {
    const {
      description,
      grp_1,
      grp_2,
      images,
      inEditMode,
      isLoading,
      isUploading,
      price,
      tags,
      tagsText,
    } = this.state;

    if (isLoading) return null;

    return (
      <React.Fragment>
        <Foect.Form
          onValidSubmit={this.onSave}
          defaultValue={{ description, price }}
          onInvalidSubmit={this.onInvalidSubmit}>
          {form => (
            <Container>
              <Header>
                <Left style={styles.container}>
                  <NBButton transparent onPress={this.goBackConditional}>
                    <MaterialIcons
                      color={colors.black}
                      name="close"
                      size={28}
                    />
                  </NBButton>
                </Left>
                <Body style={styles.flex2AndCenter}>
                  <Title style={styles.title}>
                    {inEditMode
                      ? I18n.t('add_or_edit_item.edit_item_header')
                      : I18n.t('add_or_edit_item.add_item_header')}
                  </Title>
                  <NBButton
                    hitSlop={{ top: 0, left: 15, bottom: 0, right: 20 }}
                    onPress={this.toggleInfoDialog}
                    style={{ marginTop: 5 }}
                    transparent>
                    <MaterialCommunityIcons
                      color={colors.red}
                      name="information-outline"
                      size={18}
                    />
                  </NBButton>
                </Body>
                <Right>
                  <NBButton
                    testID="saveButton"
                    transparent
                    style={{ backgroundColor: colors.transparent }}
                    onPress={() => form.submit()}>
                    <MaterialIcons
                      name="check"
                      color={colors.black}
                      size={28}
                    />
                  </NBButton>
                </Right>
              </Header>
              <Content>
                <View style={styles.body}>
                  <AntImagePicker
                    files={images}
                    onImageClick={index => {
                      !this.state.images[index].isUploading &&
                        this.selectPhotoTapped(index);
                    }}
                    onAddImageClick={() =>
                      this.selectPhotoTapped(images.length)
                    }
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
                    <FormLabel labelStyle={styles.label}>
                      {I18n.t('add_or_edit_item.price_label')}
                    </FormLabel>
                    <TouchableOpacity
                      hitSlop={{ top: 10, left: 5, bottom: 5, right: 10 }}
                      style={{ marginRight: 17 }}
                      onPress={this.togglePriceDialog}>
                      <Text>{I18n.t('add_or_edit_item.price_info')}</Text>
                    </TouchableOpacity>
                  </View>
                  <Foect.Control
                    name="price"
                    required
                    maxLength={8}
                    checkPrice={{}}>
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
                              settings.PRICE_REGEX.test(v) &&
                                control.onChange(v);
                            }}
                            placeholder={I18n.t(
                              'add_or_edit_item.price_placeholder'
                            )}
                            returnKeyType="go"
                            type="number"
                            value={control.value}
                          />
                          {control.isTouched && control.isInvalid && (
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
                          placeholder={I18n.t(
                            'add_or_edit_item.description_placeholder'
                          )}
                          value={control.value}
                        />
                      );
                    }}
                  </Foect.Control>
                  <FormLabel labelStyle={styles.label}>
                    {I18n.t('add_or_edit_item.hashtags_label')}
                  </FormLabel>
                  <TagInput
                    inputDefaultWidth={140}
                    labelExtractor={tag => tag}
                    maxHeight={2000}
                    onChange={this.changeTags}
                    onChangeText={this.changeTagsTest}
                    onBlur={() =>
                      this.changeTagsTest(this.state.tagsText + ',')
                    }
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
                </React.Fragment>
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
        {this.renderInfoDialog()}
        {this.renderPriceDialog()}
      </React.Fragment>
    );
  }

  toggleInfoDialog = () =>
    this.setState(prevState => ({
      dialogInfoVisible: !prevState.dialogInfoVisible,
    }));

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
        <Dialog.Button
          label={I18n.t('product.toast_warning_ok_button')}
          onPress={this.toggleInfoDialog}
        />
      </Dialog.Container>
    </React.Fragment>
  );

  togglePriceDialog = () =>
    this.setState(prevState => ({
      dialogPriceVisible: !prevState.dialogPriceVisible,
    }));

  renderPriceDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.dialogPriceVisible}
        onBackdropPress={this.togglePriceDialog}
        onBackButtonPress={this.togglePriceDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Title>
          {I18n.t('add_or_edit_item.price_popup_title')}
        </Dialog.Title>
        <Dialog.Description style={{ textAlign: 'justify' }}>
          {I18n.t('add_or_edit_item.price_popup_body')}
        </Dialog.Description>
        <Dialog.Button
          label={I18n.t('product.toast_warning_ok_button')}
          onPress={this.togglePriceDialog}
        />
      </Dialog.Container>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.black,
    marginLeft: 22,
    marginRight: 5,
  },
  body: {
    alignItems: 'flex-start',
    height: width / 6 + 10,
    marginHorizontal: 17,
    paddingTop: 18,
  },
  flex2AndCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    flexDirection: 'row',
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
    alignItems: 'center',
    alignSelf: 'center',
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
  if (!val) return null; // valid

  if (parseFloat(val) < settings.MIN_PRICE) {
    // error
    return { checkPrice: true };
    // valid
  } else return null;
});
