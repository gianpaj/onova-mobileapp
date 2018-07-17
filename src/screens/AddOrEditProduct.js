// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Alert, Dimensions, StyleSheet, Platform, View } from 'react-native';
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
import {
  ImagePicker as AntImagePicker,
  InputItem,
  NoticeBar,
  TextareaItem,
  Toast,
  WingBlank,
} from 'antd-mobile-rn';
import Permissions from 'react-native-permissions';
// import RNFetchBlob from 'rn-fetch-blob';
let RNFetchBlob;
let RNAndroidLocationEnabler;
if (Platform.OS == 'android') {
  RNAndroidLocationEnabler = require('react-native-android-location-enabler');
  RNFetchBlob = require('rn-fetch-blob').default;
}

import { Header, HR, TagInput } from '../components';
import { enableRefresh } from '../actions/actionCreator';
import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { Dispatch, UserData, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

const width = Dimensions.get('window').width;

const brands = require('../assets/brands.json');

const IMAGE_WIDTH = 1440;
const IMAGE_HEIGHT = 1440;

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  description: string,
  descriptionFocused: boolean,
  grp_1: number,
  grp_2: number,
  images: any,
  inEditMode: boolean,
  isLoading: boolean,
  location: ?{
    longitude: number,
    latitude: number,
  },
  numberOfBrands: number,
  pending: boolean,
  price: string,
  priceFocused: boolean,
  tags: Array<string>,
  tagsText: string,
  uuid: string,
};

export class AddOrEditProductScreen extends React.Component<Props, State> {
  static navigationOptions = (props: any) => {
    return {
      // navigate to the screen instead of showing as a normal tab screen
      tabBarOnPress: ({ scene }: any) => {
        if (!scene.focused) {
          props.navigation.navigate({
            routeName: 'addOrEditProduct',
            key: `addOrEditProduct`,
          });
        }
      },
    };
  };

  state = {
    description: '',
    descriptionFocused: false,
    grp_1: -1,
    grp_2: -1,
    images: [],
    inEditMode: false,
    isLoading: true,
    location: null,
    numberOfBrands: 0,
    pending: false,
    price: '',
    priceFocused: false,
    tags: [],
    tagsText: '',
    uuid: '',
  };

  componentDidMount() {
    const { params } = this.props.navigation.state;
    if (params && params.item) {
      this.setState({ inEditMode: true, isLoading: false });
      const { item }: { item: Product } = params;
      let images = [];
      for (let i = 0; i < item.photoURIs.length; i++) {
        images.push({
          url: item.photoURIs[i],
          id: i,
        });
      }
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

    Toast.loading(I18n.t('alerts.loading_message'), 20);
    Permissions.check('location')
      .then(response => {
        // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        console.log(response);
        if (response === 'restricted' || response === 'denied') {
          // show error
          this.alertForPermission(response);
          this.closeModal();
        } else if (response === 'undetermined') {
          // show Modal explaining why
          this.alertForPermission(response);
        } else {
          // authorized
          this.getLocationAndInitiate();
        }
      })
      .catch(e => console.error(e))
      .then(() => {
        this.setState({ isLoading: false });
        Toast.hide();
      });
  }

  getLocationAndInitiate = () => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { coords } = position;
        console.log(coords);
        this.setState({
          location: {
            longitude: coords.longitude,
            latitude: coords.latitude,
          },
        });
        // not editing
        this.selectPhotoTapped(0);
      },
      err => {
        // Location authorized but not setting is not enabled (only Android)
        if (
          err.message === 'No location provider available.' &&
          Platform.OS === 'android'
        ) {
          return RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
            interval: 10000,
            fastInterval: 5000,
          })
            .then(() => {})
            .catch(() => this.closeModal());
        }
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 20 * 1000, maximumAge: 60 * 1000 }
    );
  };

  alertForPermission(response: string) {
    Alert.alert(
      I18n.t('add_or_edit_item.permission_title'),
      I18n.t('add_or_edit_item.permission_message'),
      [
        {
          text: I18n.t('profile.alert_unsaved_changes_button_cancel'),
          onPress: () => {
            console.log('Permission denied');
            this.closeModal();
          },
          style: 'cancel',
        },
        response === 'undetermined'
          ? {
              text: I18n.t('profile.alert_unsaved_changes_button_confirm'),
              onPress: this.requestPermission,
            }
          : {
              text: I18n.t('add_or_edit_item.permission_alert_button_settings'),
              onPress: () => {
                if (Platform.OS === 'android') {
                  RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
                    interval: 10000,
                    fastInterval: 5000,
                  })
                    .then(() => {})
                    .catch(() => this.closeModal());
                } else {
                  Permissions.openSettings();
                }
                this.closeModal();
              },
            },
      ]
    );
  }

  requestPermission = () => {
    Permissions.request('location').then(response => {
      // Returns once the user has chosen to 'allow' or to 'not allow' access
      // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
      if (response !== 'authorized') {
        // show error
        this.closeModal();
      } else {
        this.getLocationAndInitiate();
      }
    });
  };

  selectPhotoTapped = (i: number = 0) => {
    if (this.state.pending) return;

    if (global.__TESTING__) {
      return ImagePicker.openPicker()
        .then(response => this.appendPhoto(response, i))
        .catch(() => this.closeModalConditional());
    }

    const imagePickerOptons = {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      compressImageMaxWidth: IMAGE_WIDTH,
      compressImageMaxHeight: IMAGE_HEIGHT,
      compressImageQuality: 0.7,
      // cropping: true,
      mediaType: 'photo',
      cropperToolbarTitle: I18n.t('add_or_edit_item.cropper_toolbar_title'),
      // ios
      cropperChooseText: I18n.t('add_or_edit_item.cropper_choose_text'),
      // ios
      cropperCancelText: I18n.t('add_or_edit_item.cropper_cancel_text'),
    };

    const CAMERA = I18n.t('add_or_edit_item.select_photo_source_camera');
    const GALLERY = I18n.t('add_or_edit_item.select_photo_source_gallery');
    const CANCEL = I18n.t('add_or_edit_item.select_photo_source_cancel');
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

  appendPhoto(response: any, i: number) {
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

  closeModalConditional = () => {
    const { inEditMode, images } = this.state;
    if (!inEditMode && images.length === 0 /* && fields.touched() */) {
      this.props.navigation.goBack();
    }
  };

  onAddOrEditItem = async () => {
    Toast.loading(I18n.t('add_or_edit_item.toast_uploading'), 30);
    const {
      description,
      images,
      price,
      grp_1,
      grp_2,
      tags,
      inEditMode,
      location,
      uuid,
    } = this.state;

    this.setState({ pending: true, tagsText: '' });

    const formData = new FormData();
    formData.append('description', description.trim());
    formData.append('price', price);
    formData.append('categoryIds', grp_1.toString());
    formData.append('typeIds', grp_2.toString());
    if (tags.length) formData.append('tags', JSON.stringify(tags));

    // const config = {
    //   onUploadProgress: function(progressEvent) {
    //     const percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
    //   },
    // };

    if (inEditMode) {
      var todo = images.length;
      if (!todo) return;
      images.forEach(async (image, i) => {
        // if remote file
        if (Platform.OS == 'android' && image.url.startsWith('http')) {
          RNFetchBlob.config({
            fileCache: true,
            session: 'edit',
            appendExt: 'jpg',
          })
            .fetch('GET', image.url)
            .then(res => {
              // the temp file path
              // console.log('The file saved to ', res.path());
              formData.append('photos', {
                uri: `file://${res.path()}`,
                type: 'image/jpeg',
                name: 'image' + i + '.jpg',
              });
              if (--todo === 0) return this.uploadEditedProduct(uuid, formData);
            });
        } else {
          formData.append('photos', {
            uri: image.url,
            type: 'image/jpeg',
            name: 'image' + i + '.jpg',
          });
          if (--todo === 0) return this.uploadEditedProduct(uuid, formData);
        }
      });

      // RNFetchBlob.session('edit')
      //   .dispose()
      //   .then(() => console.log('cleaned'));
    } else {
      if (!location) {
        throw Error('location is required');
      }
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      images.forEach((image, i) => {
        // $FlowFixMe
        formData.append('photos', {
          uri: image.url,
          type: 'image/jpeg',
          name: 'image' + i + '.jpg',
        });
      });
      this.uploadNewProduct(uuid, formData);
    }
  };

  uploadNewProduct = (uuid: string, formData: any): void => {
    const { token } = this.props;
    api
      .post('/api/products', formData, { token, timeout: 300000 })
      .then(res => {
        console.debug(res);
        this.props.dispatch(enableRefresh());
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

  uploadEditedProduct = (uuid: string, formData: any): Promise<any> => {
    const { token } = this.props;
    return (
      api
        .put(`/api/products/${uuid}`, formData, {
          token,
          timeout: 30000,
        })
        .then(res => {
          console.debug(res);
          this.props.dispatch(enableRefresh());
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

  /**
   * numbers only, one dot and 2 decimal points
   */
  changePrice = (price: string) => {
    const pattern = /^(\b[\d]+[\.]?[\d]{0,2})$/;
    if (pattern.test(price) || price === '') {
      this.setState({ price });
    }
  };

  addEnabled(): boolean {
    // const pricePattern = /^\d+(\.\d{2})?$/;
    // const tagsPattern = /^(\b[a-z][a-z0-9]*)$/i;

    // return true if all of these are true
    return (
      // If there is at least one image
      this.state.images.length > 0 &&
      // location
      (this.state.inEditMode || this.state.location !== null) &&
      // If the item is uploading is NOT in progress
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
    this.closeModalConditional();
    this.setState({ images });
  };

  onChangeDescription = (t: string) => this.setState({ description: t });

  shouldShowNoticeBar() {
    return this.props.userData.accountStatus == 'notverified';
  }

  render() {
    const {
      description,
      descriptionFocused,
      grp_1,
      grp_2,
      images,
      inEditMode,
      isLoading,
      pending,
      price,
      priceFocused,
      tags,
      tagsText,
    } = this.state;

    // if (images.length < 1 && !inEditMode) return null;
    if (isLoading) return null;

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <NBButton transparent onPress={() => this.closeModal()}>
              <Icon name="close" size={28} />
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
              testID="addItemButton"
              transparent
              disabled={!this.addEnabled()}
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onAddOrEditItem}>
              <Icon
                name="check"
                style={!this.addEnabled() && { color: colors.grey4 }}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <Content>
          {this.shouldShowNoticeBar() && (
            <NoticeBar
              marqueeProps={{ loop: false, style: styles.noticeBar }}
              icon={false}>
              {I18n.t('profile.notice_bar')}
            </NoticeBar>
          )}
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
            <FormLabel labelStyle={styles.label}>
              {I18n.t('add_or_edit_item.price_label')}
            </FormLabel>
            {/* <FormInput
              autoCorrect={false}
              clearButtonMode="while-editing"
              containerStyle={styles.inputContainer}
              editable={!pending}
              inputStyle={styles.input}
              keyboardType="numeric"
              maxLength={8} // 10000.99
              onChangeText={this.changePrice}
              placeholder={I18n.t('add_or_edit_item.price_placeholder')}
              value={price}
            /> */}
            <View style={{ paddingLeft: 6 }}>
              <InputItem
                testID="price"
                autoCorrect={false}
                clearButtonMode="while-editing"
                editable={!pending}
                error={priceFocused && price.trim().length < 1}
                last
                maxLength={8} // 10000.99
                onChange={this.changePrice}
                onFocus={() => this.setState({ priceFocused: true })}
                placeholder={I18n.t('add_or_edit_item.price_placeholder')}
                type="number"
                value={price}
              />
            </View>
            <FormLabel labelStyle={styles.label}>
              {I18n.t('add_or_edit_item.description_label')}
            </FormLabel>
            <TextareaItem
              testID="description"
              editable={!pending}
              style={styles.inputContainerNew}
              last // to set borderBottomWidth=0
              containerStyle={{ borderBottomWidth: 5, marginRight: 12 }}
              rows={3}
              count={settings.MAX_LENGTH_DESCRIPTION}
              onChangeText={this.onChangeDescription}
              onFocus={() => this.setState({ descriptionFocused: true })}
              placeholder={I18n.t('add_or_edit_item.description_placeholder')}
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
              editable={!pending}
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
                    labelHorizontal
                    obj={option}
                    index={i}
                    onPress={grp_1 => !pending && this.setState({ grp_1 })}
                    labelStyle={styles.radioButtonLabel}
                  />
                  <RadioButtonInput
                    obj={option}
                    index={i}
                    isSelected={grp_1 == i}
                    onPress={grp_1 => !pending && this.setState({ grp_1 })}
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
          <HR color={colors.grey6} />
          <View style={[styles.grps, { marginBottom: 20 }]}>
            <RadioForm animation formHorizontal>
              {ui.category_radio_grp_2.map((option, i) => (
                <RadioButton labelHorizontal={false} key={i}>
                  <RadioButtonLabel
                    labelHorizontal
                    obj={option}
                    index={i}
                    onPress={grp_2 => !pending && this.setState({ grp_2 })}
                    labelStyle={styles.radioButtonLabel}
                  />
                  <RadioButtonInput
                    obj={option}
                    index={i}
                    isSelected={grp_2 == i}
                    onPress={grp_2 => !pending && this.setState({ grp_2 })}
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
  noticeBar: {
    color: colors.grey2,
    textAlign: 'center',
    width: '34.5%',
  },
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
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const AddOrEditProduct = connect(mapStateToProps)(
  AddOrEditProductScreen
);
