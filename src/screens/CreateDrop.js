// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Toast } from 'antd-mobile-rn';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Permissions from 'react-native-permissions';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Left,
  List,
  Right,
  Title,
} from 'native-base';
import { format } from 'date-fns';
import ObjectID from 'bson-objectid';

import colors from '../config/colors';
import { Header, NoticeBar } from '../components';
import imagePickerStyle from '../components/ImagePicker.styles';
import I18n from '../i18n';
import * as api from '../utils/api';
import * as linking from '../utils/linking';
import * as ui from '../utils/ui';
import { getPersonalUserData } from '../actions/actionCreator';

import type { Dispatch, UserData, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  token: string,
  userData: UserData,
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
const MAX_DATE = new Date(
  new Date().setMonth(new Date().getMonth() + INC_MONTH)
);

const pickerProps = {
  confirmTextIOS: I18n.t('create_drop.ok'),
  cancelTextIOS: I18n.t('create_drop.cancel'),
  titleIOS: I18n.t('create_drop.select'),
  date: new Date(),
};

export class CreateDropScreen extends React.Component<Props, State> {
  static navigationOptions = (props: any) => {
    return {
      // navigate to the screen instead of showing as a normal tab screen
      tabBarOnPress: ({ scene }: any) => {
        if (!scene.focused) {
          props.navigation.navigate({
            routeName: 'createDrop',
            key: 'createDrop',
          });
        }
      },
    };
  };

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
    const loader = setTimeout(() => {
      Toast.loading(I18n.t('alerts.loading_message'), 20);
    }, 500);

    // check if we user has payment and settings info
    try {
      await this.props.dispatch(getPersonalUserData());
      clearTimeout(loader);
      if (!this.canCreateDrop()) {
        throw new Error(I18n.t('create_drop.cannot_create_drop_alert'));
      }
    } catch (error) {
      this.closeModal();
      this.props.navigation.navigate('settings');
      clearTimeout(loader);
      Toast.hide();
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
      this.setState({ isLoading: false });
    } catch (error) {
      // TODO: show better error message if location is denied
      // translate
      this.setState({ isLoading: false });
      console.debug(error);
    }
    Toast.hide();
  }

  canCreateDrop() {
    const {
      mobileNumber,
      paymentInfo: p,
      shippingAddress: s,
    } = this.props.userData;
    return (
      mobileNumber &&
      p.last_four &&
      p.method &&
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
    Alert.alert(
      I18n.t('create_drop.permission_title'),
      I18n.t('create_drop.permission_message'),
      [
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
      ]
    );
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
        ({ coords: { longitude, latitude } }) =>
          resolve({ longitude, latitude }),
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
              .then(() =>
                navigator.geolocation.getCurrentPosition(
                  ({ coords: { longitude, latitude } }) =>
                    resolve({ longitude, latitude }),
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
    const { products, location } = this.state;
    return (
      // if any products have been uploaded
      products.filter((i: any) => i.uploaded === true).length > 0 &&
      location !== null
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
  };

  onSendDrop = async () => {
    const { datetime, products, location } = this.state;
    const { token } = this.props;

    if (!location) return this.alertForPermission('denied');

    const loader = setTimeout(() => {
      Toast.loading(I18n.t('alerts.toast_uploading'), 30);
    }, 500);
    this.setState({ pending: true });

    const productsReady = products.filter(i => i.uploaded === true);

    const dropId = ObjectID();
    const promises = productsReady.map(product => {
      const formData = {
        ...product,
        date: datetime,
        dropId,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      };
      delete formData.key;
      delete formData.uploaded;
      return api.post('/api/schedule', formData, {
        token,
        timeout: 20000,
      });
    });

    try {
      await Promise.all(promises);
      clearTimeout(loader);
      Toast.hide();
      ui.showToast(I18n.t('create_drop.success'), 'success');
      this.closeModal();
    } catch (err) {
      Toast.hide();
      ui.showToast(err.message, 'warning');
      this.setState({ pending: false });
    }
  };

  setDate = (date: Date) => {
    this.setState(prevState => {
      const datetime = new Date(prevState.datetime).setFullYear(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      return { datetime: new Date(datetime) };
    });
    this._toggleDatePicker();
  };

  setTime = (time: Date) => {
    this.setState(prevState => {
      const datetime = new Date(prevState.datetime).setHours(
        time.getHours(),
        time.getMinutes()
      );
      return { datetime: new Date(datetime) };
    });
    this._toggleTimePicker();
  };

  returnData = (product: Product) => {
    this.setState(prevState => {
      return {
        products: [
          ...prevState.products,
          { ...product, uploaded: true, key: prevState.products.length + 1 },
        ],
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

  _toggleDatePicker = () =>
    this.setState({ isDatePickerVisible: !this.state.isDatePickerVisible });

  _toggleTimePicker = () =>
    this.setState({ isTimePickerVisible: !this.state.isTimePickerVisible });

  // show alert prompt
  // if confirmed
  removeImage = (key: string) =>
    this.setState(prevState => ({
      products: prevState.products.filter(product => product.key !== key),
    }));

  shouldShowAccountNotVerifiedNoticeBar() {
    return this.props.userData.accountStatus === 'notverified';
  }

  shouldShowNoLocationGatheredNoticeBar = () => this.state.location === null;

  render() {
    let {
      products,
      datetime,
      isLoading,
      isDatePickerVisible,
      isTimePickerVisible,
    } = this.state;

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
            <Title
              style={{ color: colors.black, marginLeft: 22, marginRight: 5 }}>
              {I18n.t('create_drop.title')}
            </Title>
            <NBButton
              hitSlop={{ top: 0, left: 15, bottom: 0, right: 20 }}
              onPress={linking.openURL.bind(this, 'https://onova.co/drop.html')}
              style={{ marginTop: 5 }}
              transparent>
              <MaterialCommunityIcons name="information-outline" size={18} />
            </NBButton>
          </Body>
          <Right>
            <NBButton
              testID="sendDropButton"
              disabled={!this.isButtonEnabled()}
              style={{ backgroundColor: colors.transparent }}
              // style={{ backgroundColor: colors.transparent }}
              transparent
              onPress={this.onSendDrop}>
              <MaterialIcons
                name="check"
                color={this.isButtonEnabled() ? colors.black : colors.grey4}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        {isLoading ? null : (
          <>
            <View>
              {this.shouldShowAccountNotVerifiedNoticeBar() ? (
                <NoticeBar marqueeProps={{ style: styles.noticeBar }}>
                  {I18n.t('alerts.notice_bar_account_verification')}
                </NoticeBar>
              ) : (
                this.shouldShowNoLocationGatheredNoticeBar() && (
                  <NoticeBar
                    marqueeProps={{ loop: true, style: styles.noticeBar }}
                    mode="button"
                    buttonText={I18n.t(
                      'alerts.notice_bar_location_not_gathered_button'
                    )}
                    onPress={this.getLocationAndInitiate}>
                    {I18n.t('alerts.notice_bar_location_not_gathered')}
                  </NoticeBar>
                )
              )}
              <List>
                <View style={styles.datesContainer}>
                  <Text
                    style={styles.dateStrings}
                    onPress={this._toggleDatePicker}>
                    {format(datetime, 'D MMM')}
                  </Text>
                  <Text
                    style={styles.dateStrings}
                    onPress={this._toggleTimePicker}>
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
                />
                <DateTimePicker
                  mode="time"
                  isVisible={isTimePickerVisible}
                  onConfirm={this.setTime}
                  onCancel={this._closePickers}
                  {...pickerProps}
                />
              </List>
            </View>
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
        <View>
          <Image
            source={{
              uri: product.photos[0].replace('.jpg', '-thumb.jpg'),
            }}
            style={[styles.size, imagePickerStyle.image]}
          />
          <TouchableOpacity
            onPress={() => !this.state.pending && this.removeImage(product.key)}
            style={styles.closeWrap}
            activeOpacity={0.6}>
            <Text style={imagePickerStyle.closeText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        product.next && (
          <TouchableOpacity
            onPress={this.onNewItem}
            style={[
              imagePickerStyle.item,
              styles.size,
              imagePickerStyle.plusWrap,
              imagePickerStyle.plusWrapNormal,
            ]}>
            <Text style={imagePickerStyle.plusText}>+</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const MARGIN = 1;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  flex2AndCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    flexDirection: 'row',
  },
  closeWrap: {
    width: 16,
    height: 16,
    backgroundColor: colors.grey2,
    borderRadius: 8,
    position: 'absolute',
    top: 4 + 7,
    right: 4 + 7,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 4,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: 0,
  },
  noticeBar: {
    fontSize: 15,
    color: colors.grey1,
  },
  list: {
    flex: 1,
    marginTop: -1,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 25,
  },
  dateStrings: {
    color: colors.black,
    paddingHorizontal: 20,
    fontSize: 18,
  },
  size: {
    width: width / 3 - 20,
    height: width / 3 - 20,
    margin: 10,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const CreateDrop = connect(mapStateToProps)(CreateDropScreen);
