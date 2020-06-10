// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Alert, Dimensions, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Toast } from 'antd-mobile-rn';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Permissions from 'react-native-permissions';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import { Body, Button as NBButton, Container, Content, Left, List, Right } from 'native-base';
import { format } from 'date-fns';
import { URL } from 'react-native-dotenv';

import colors from '../config/colors';
import { Header, NoticeBar, Info, Title } from '../components';
import imagePickerStyle from '../components/ImagePicker.styles';
import I18n from '../i18n';
import * as api from '../utils/api';
import * as linking from '../utils/linking';
import * as ui from '../utils/ui';
import { getPersonalUserData } from '../actions/actionCreator';
import { store } from '../App';

import type { Dispatch, UserData, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';
import Loader from '../components/Loader';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  token: string,
  userData: UserData,
  skippedLogin: boolean,
};

type State = {
  datetime: Date,
  isDatePickerVisible: boolean,
  isLoading: boolean,
  isTimePickerVisible: boolean,
  pending: boolean,
  products: Array<Product>,
  location: ?{
    longitude: number,
    latitude: number,
  },
};

const { width } = Dimensions.get('window');
// const MIN_DATE = new Date(
//   new Date().setMinutes(Math.ceil(new Date().getMinutes() / 5) * 5)
// );
const INC_MONTH = 1;
const MAX_DATE = new Date(new Date().setMonth(new Date().getMonth() + INC_MONTH));

const pickerProps = {
  confirmTextIOS: I18n.t('create_drop.ok'),
  cancelTextIOS: I18n.t('create_drop.cancel'),
  titleIOS: I18n.t('create_drop.select'),
};

export class CreateDropScreen extends React.Component<Props, State> {
  static navigationOptions = (props: any) => ({
    tabBarOnPress: ({ scene }: any) => {
      // FIXME: hack
      const state: ReduxState = store.getState();
      if (state.LoginReducer.skippedLogin) {
        props.navigation.navigate({
          routeName: 'inAppAuth',
          key: 'inAppAuth',
        });
        return;
      }
      // navigate to the screen instead of showing as a normal tab screen
      if (!scene.focused) {
        props.navigation.navigate({
          routeName: 'createDrop',
          key: 'createDrop',
        });
      }
    },
  });

  initialDate: Date;

  state = {
    datetime: new Date(),
    isDatePickerVisible: false,
    isTimePickerVisible: false,
    isLoading: true,
    location: null,
    pending: false,
    products: [],
  };

  async componentDidMount() {
    // if (this.props.skippedLogin) {
    //   // FIXME: do not flickr
    //   this.props.navigation.goBack();
    //   setTimeout(() => {
    //     this.props.navigation.navigate('inAppAuth');
    //   }, 300);
    //   return;
    // }
    const loader = setTimeout(() => {
      Toast.loading(I18n.t('alerts.loading_message'), 20);
    }, 500);

    this.initialDate = new Date();

    // check if user has payment and settings info
    try {
      await this.props.dispatch(getPersonalUserData());
      clearTimeout(loader);
      if (!this.canCreateDrop()) {
        throw new Error(I18n.t('create_drop.cannot_create_drop_alert'));
      }
    } catch (error) {
      this.closeModal();
      this.props.navigation.navigate({
        key: 'settings',
        routeName: 'settings',
      });
      clearTimeout(loader);
      Toast.hide();
      // TODO: translate error
      ui.showToast(error.message, 'warning', 'OK', 4);
      return;
    }

    try {
      const response = await Permissions.check('location');
      // Response is one of: 'authorized', 'denied', 'restricted' or 'undetermined'
      console.debug('location permission:', response);
      if (response === 'restricted' || response === 'denied') {
        // show error
        this.alertForPermission(response);
        // this.closeModal();
      } else if (response === 'undetermined') {
        // show Modal explaining why
        this.alertForPermission(response);
      } else {
        // authorized
        await this.getLocationAndInitiate();
      }
      // FIXME: await the alertForPermission() - it should return a promise
    } catch (error) {
      // TODO: show better error message if location is denied
      // translate
      console.debug(error);
    }
    this.setState({ isLoading: false });
    Toast.hide();
  }

  canCreateDrop() {
    const { mobileNumber, paymentInfo: p, shippingAddress: s } = this.props.userData;

    return (
      mobileNumber &&
      p &&
      ((p.short && p.short.last_four) || (p.full && p.full.last_four)) &&
      s &&
      s.firstName &&
      s.lastName &&
      s.city &&
      s.departmentNovaposhta
    );
  }

  /**
   * Show Modal explaining why location is needed
   *
   * @param {*} response 'authorized', 'denied', 'restricted' or 'undetermined'
   */
  alertForPermission(response: string) {
    Alert.alert(I18n.t('create_drop.permission_title'), I18n.t('create_drop.permission_message'), [
      {
        text: I18n.t('profile.alert_unsaved_changes_button_cancel'),
        onPress: () => {
          console.log('Permission denied');
          // this.closeModal();
        },
        style: 'cancel',
      },
      response === 'undetermined'
        ? {
            text: I18n.t('profile.alert_unsaved_changes_button_confirm'),
            onPress: this.requestPermission,
          }
        : {
            // 'restricted' || 'denied'
            text: I18n.t('create_drop.permission_alert_button_settings'),
            onPress: () => {
              if (Platform.OS === 'ios') {
                return Permissions.openSettings();
              }
              // android
              RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
                interval: 10000,
                fastInterval: 5000,
              })
                .then(() => this.getLocationAndInitiate())
                .catch(err => {
                  // ERR00 : The user canceled the popup
                  // ERR01 : If the Settings change are unavailable
                  // ERR02 : If the popup has failed to open
                  console.debug(err);
                  // this.closeModal();
                });
              // this.closeModal();
            },
          },
    ]);
  }

  requestPermission = () => {
    // $FlowFixMe
    Permissions.request('location').then(response => {
      // Returns once the user has chosen to 'allow' or to 'not allow' access
      // Response is one of: 'authorized', 'denied', 'restricted' or 'undetermined'
      if (response === 'authorized') this.getLocationAndInitiate();
    });
  };

  getLocationAndInitiate = async () => {
    try {
      const location = await this.tryToGetLocationAndInitiate();
      this.setState({ location });
      console.log(location);
    } catch (error) {
      console.error(error);
    }
  };

  tryToGetLocationAndInitiate = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = 20; // seconds
      navigator.geolocation.getCurrentPosition(
        ({ coords: { longitude, latitude } }) => resolve({ longitude, latitude }),
        err => {
          // Location authorized but not setting is not enabled (only Android)
          if (err.message === 'No location provider available.' && Platform.OS === 'android') {
            return RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
              interval: 10000,
              fastInterval: 5000,
            })
              .then(() =>
                navigator.geolocation.getCurrentPosition(
                  ({ coords: { longitude, latitude } }) => resolve({ longitude, latitude }),
                  err => {
                    throw err;
                  },
                  {
                    enableHighAccuracy: false,
                    maximumAge: 100,
                    timeout: timeout * 1000,
                  }
                )
              )
              .catch(err => {
                // ERR00 : The user canceled the popup
                // ERR01 : If the Settings change are unavailable
                // ERR02 : If the popup has failed to open
                console.debug(err);
                // this.closeModal();
                reject(err);
              });
          }
          reject(err);
          Toast.fail(err.message || JSON.stringify(err));
          // this.closeModal();
          console.debug(err);
        },
        {
          enableHighAccuracy: false,
          maximumAge: 10 * 60 * 1000, // 5 minutes
          timeout: timeout * 1000,
        }
      );
    });
  };

  // return true if all of these are true
  isButtonEnabled(): boolean {
    const { products, location, pending } = this.state;
    return (
      // if any products have been uploaded
      products.filter((i: any) => i.uploaded === true).length > 0 && location !== null && !pending
    );
  }

  closeModal = () => this.props.navigation.goBack();

  hasUnsavedChanges(): boolean {
    return this.state.products.filter(i => i.uploaded === true).length > 0;
  }

  closeModalConditional = () => {
    if (this.hasUnsavedChanges()) {
      ui.showConfirmAlert(
        I18n.t('profile.alert_unsaved_changes_title'),
        I18n.t('profile.alert_unsaved_changes_body'),
        // on continue
        () => this.closeModal(),
        () => {},
        I18n.t('profile.alert_unsaved_changes_button_cancel'),
        I18n.t('profile.alert_unsaved_changes_button_confirm')
      );
    } else {
      this.closeModal();
    }
  };

  onSendDrop = async () => {
    const { datetime, products, location } = this.state;
    const { token } = this.props;

    if (!location) return this.alertForPermission('denied');

    this.setState({ pending: true });

    const loader = setTimeout(() => {
      Toast.loading(I18n.t('alerts.toast_uploading'), 30);
    }, 500);

    let productsReady = products.filter(i => i.uploaded === true);

    productsReady = productsReady.map(product => {
      // eslint-disable-next-line no-unused-vars
      const { key, uploaded, ...rest } = product;
      return rest;
    });

    const formData = {
      date: new Date(datetime.getTime()),
      products: productsReady,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    };

    try {
      await api.post('/api/v2/drops', formData, {
        token,
        timeout: 20000,
      });
      clearTimeout(loader);
      Toast.hide();
      ui.showToast(I18n.t('create_drop.success'), 'success');
      this.closeModal();
    } catch (err) {
      clearTimeout(loader);
      Toast.hide();
      ui.showToast(err.message, 'warning');
      this.setState({ pending: false });
    }
  };

  setDate = (date: Date) => {
    this.setState(prevState => {
      const datetime = new Date(prevState.datetime).setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      return { datetime: new Date(datetime) };
    });
    this._toggleDatePicker();
  };

  setTime = (time: Date) => {
    this.setState(prevState => {
      const datetime = new Date(prevState.datetime).setHours(time.getHours(), time.getMinutes());
      return { datetime: new Date(datetime) };
    });
    this._toggleTimePicker();
  };

  returnData = (product: Product) => {
    this.setState(prevState => {
      return {
        products: [...prevState.products, { ...product, uploaded: true, key: prevState.products.length + 1 }],
      };
    });
  };

  onNewItem = () => {
    if (this.state.pending) return;
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'addOrEditProduct',
      params: { returnData: this.returnData },
      key: 'addOrEditProduct',
    });
  };

  _keyExtractor = (item): string => item.key;

  _closePickers = () =>
    this.setState({
      isDatePickerVisible: false,
      isTimePickerVisible: false,
    });

  _toggleDatePicker = () => this.setState({ isDatePickerVisible: !this.state.isDatePickerVisible });

  _toggleTimePicker = () => this.setState({ isTimePickerVisible: !this.state.isTimePickerVisible });

  // show alert prompt
  // if confirmed
  removeImage = (key: string) => {
    if (this.state.pending) return;
    this.setState(prevState => ({
      products: prevState.products.filter(product => product.key !== key),
    }));
  };

  shouldShowAccountNotVerifiedNoticeBar() {
    return this.props.userData.accountStatus === 'notverified';
  }

  shouldShowNoLocationGatheredNoticeBar = () => this.state.location === null;

  render() {
    let { products, datetime, isLoading, isDatePickerVisible, isTimePickerVisible } = this.state;

    const next = [
      {
        uploaded: false,
        key: products.length + 1,
        next: true,
      },
    ];
    products = [...products, ...next];

    return (
      <Container>
        <Header>
          <Left style={styles.flex1}>
            <NBButton transparent onPress={this.closeModalConditional}>
              <MaterialIcons color={colors.black} name="close" size={28} />
            </NBButton>
          </Left>
          <Body style={styles.flex2AndCenter}>
            <Title withIcon>{I18n.t('create_drop.title')}</Title>
            <Info onPress={linking.openURL.bind(this, `https://${URL}/drop.html`)} />
          </Body>
          <Right>
            <NBButton
              testID="sendDropButton"
              disabled={!this.isButtonEnabled()}
              style={{ backgroundColor: colors.transparent }}
              // style={{ backgroundColor: colors.transparent }}
              transparent
              onPress={this.onSendDrop}>
              <MaterialIcons name="check" color={this.isButtonEnabled() ? colors.black : colors.grey4} size={28} />
            </NBButton>
          </Right>
        </Header>
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <>
              {this.shouldShowAccountNotVerifiedNoticeBar() ? (
                <NoticeBar marqueeProps={{ style: styles.noticeBar }}>
                  {I18n.t('alerts.notice_bar_account_verification')}
                </NoticeBar>
              ) : (
                this.shouldShowNoLocationGatheredNoticeBar() && (
                  <NoticeBar
                    marqueeProps={{ loop: true, style: styles.noticeBar }}
                    mode="button"
                    buttonText={I18n.t('alerts.notice_bar_location_not_gathered_button')}
                    onPress={this.getLocationAndInitiate}>
                    {I18n.t('alerts.notice_bar_location_not_gathered')}
                  </NoticeBar>
                )
              )}
              <List>
                <View style={styles.datesContainer}>
                  <Text style={styles.dateStrings} onPress={this._toggleDatePicker}>
                    {format(datetime, 'D MMM')}
                  </Text>
                  <Text style={styles.dateStrings} onPress={this._toggleTimePicker}>
                    {format(datetime, 'HH:mm')}
                  </Text>
                </View>
                <DateTimePicker
                  mode="date"
                  isVisible={isDatePickerVisible}
                  onConfirm={this.setDate}
                  onCancel={this._closePickers}
                  minimumDate={new Date()}
                  maximumDate={MAX_DATE}
                  {...pickerProps}
                  date={this.initialDate}
                />
                <DateTimePicker
                  mode="time"
                  isVisible={isTimePickerVisible}
                  onConfirm={this.setTime}
                  onCancel={this._closePickers}
                  {...pickerProps}
                  date={this.initialDate}
                />
              </List>
            </>
            <Content>
              <FlatList
                columnWrapperStyle={styles.columnWrapper}
                data={products}
                numColumns={3}
                renderItem={this.renderItem}
                style={styles.list}
              />
            </Content>
          </>
        )}
      </Container>
    );
  }

  // eslint-disable-next-line react/no-unused-prop-types
  renderItem = ({ item: product }: { item: any }) => (
    <View style={styles.row} key={product.key}>
      {product.uploaded ? (
        <>
          <Image
            source={{
              uri: product.photos[0].replace('.jpg', '-thumb.jpg'),
            }}
            style={[styles.size, imagePickerStyle.image]}
          />
          <TouchableOpacity onPress={() => this.removeImage(product.key)} style={styles.closeWrap} activeOpacity={0.6}>
            <Text style={imagePickerStyle.closeText}>×</Text>
          </TouchableOpacity>
        </>
      ) : (
        product.next && (
          <TouchableOpacity
            onPress={this.onNewItem}
            style={[imagePickerStyle.item, styles.size, imagePickerStyle.plusWrap, imagePickerStyle.plusWrapNormal]}>
            <Text style={imagePickerStyle.plusText}>+</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const MARGIN = 1;

const styles = StyleSheet.create({
  closeWrap: {
    alignItems: 'center',
    backgroundColor: colors.grey2,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'absolute',
    right: 4 + 7,
    top: 4 + 7,
    width: 16,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: 0,
  },
  dateStrings: {
    color: colors.black,
    fontSize: 18,
    paddingHorizontal: 20,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 25,
  },
  flex1: {
    flex: 1,
  },
  flex2AndCenter: {
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    marginTop: -1,
  },
  noticeBar: {
    color: colors.grey1,
    fontSize: 15,
  },
  row: {
    alignItems: 'center',
    borderRadius: 4,
    flexDirection: 'column',
  },
  size: {
    height: width / 3 - 20,
    margin: 10,
    width: width / 3 - 20,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  skippedLogin: state.LoginReducer.skippedLogin,
  token: state.LoginReducer.token,
});

export const CreateDrop = connect(mapStateToProps)(CreateDropScreen);
