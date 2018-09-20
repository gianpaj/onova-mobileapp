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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { List, Toast } from 'antd-mobile-rn';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Permissions from 'react-native-permissions';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Left,
  Right,
  Title,
} from 'native-base';
import { format, setHours, setDate, setDay } from 'date-fns';

import colors from '../config/colors';
import { Header } from '../components';
import imagePickerStyle from '../components/ImagePicker.styles';
import I18n from '../i18n';

import type { Dispatch, UserData, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  datetime: Date,
  isDatePickerVisible: boolean,
  isTimePickerVisible: boolean,
  isLoading: boolean,
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
  // static navigationOptions = (props: any) => {
  //   return {
  //     // navigate to the screen instead of showing as a normal tab screen
  //     tabBarOnPress: ({ scene }: any) => {
  //       if (!scene.focused) {
  //         props.navigation.navigate({
  //           routeName: 'createDrop',
  //           key: `createDrop`,
  //         });
  //       }
  //     },
  //   };
  // };

  state = {
    datetime: new Date(),
    isDatePickerVisible: false,
    isTimePickerVisible: false,
    isLoading: true,
    location: null,
    pending: false,
    products: [],
  };

  componentDidMount() {
    Toast.loading(I18n.t('alerts.loading_message'), 20);
    Permissions.check('location')
      .then(response => {
        // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        console.debug('location permission:', response);
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
    // $FlowFixMe
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

  getLocationAndInitiate = () => {
    const timeout = 20; // seconds
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
        Toast.fail(err.message || JSON.stringify(err));
        this.closeModal();
        console.debug(err);
      },
      {
        enableHighAccuracy: false,
        timeout: timeout * 1000,
        maximumAge: 60 * 1000,
      }
    );
  };

  // return true if all of these are true
  isButtonEnabled(): boolean {
    const { products, location } = this.state;
    return (
      // if any products have been uploaded
      products.filter((i: any) => i.uploaded === false).length ===
        products.length && location !== null
    );
  }

  closeModal() {
    this.props.navigation.goBack();
  }

  onSendDrop = () => {
    Toast.loading(I18n.t('add_or_edit_item.toast_uploading'), 30);
    this.setState({ pending: true });
  };

  setDate = (date: Date) => {
    this.setState(prevState => {
      let datetime = new Date(prevState.datetime).setDate(date.getDate());
      datetime = new Date(datetime).setMonth(date.getMonth());
      datetime = new Date(datetime).setFullYear(date.getFullYear());
      return { datetime: new Date(datetime) };
    });
    this._toggleDatePicker();
  };

  setTime = (time: Date) => {
    this.setState(prevState => {
      let datetime = new Date(prevState.datetime).setMinutes(time.getMinutes());
      datetime = new Date(datetime).setHours(time.getHours());
      return { datetime: new Date(datetime) };
    });
    this._toggleTimePicker();
  };

  returnData = (product: Product) => {
    console.log(product);
    this.setState(prevState => {
      return {
        products: [
          { ...product, uploaded: true, key: prevState.products.length + 1 },
          ...prevState.products,
        ],
      };
    });
  };

  onNewItem = () => {
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

  _handleDatePicked;

  removeImage = (key: string) => {
    // show alert prompt
    // if confirmed
    this.setState(prevState => {
      return {
        products: prevState.products.filter(product => product.key !== key),
      };
    });
  };

  render() {
    let {
      products,
      datetime,
      isLoading,
      isDatePickerVisible,
      isTimePickerVisible,
    } = this.state;

    if (isLoading) return null;

    if (products.length < 9) {
      const emptyToAdd = 9 - products.length;
      let emptyProducts = [];
      emptyProducts.push({
        uploaded: false,
        key: products.length + 1,
        next: true,
      });
      for (let i = 0; i < emptyToAdd - 1; i++) {
        emptyProducts.push({ uploaded: false, key: products.length + i });
      }
      products = [...products, ...emptyProducts];
    }

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <NBButton transparent onPress={this.closeModal}>
              <Icon name="close" size={28} />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>
              {I18n.t('create_drop.title')}
            </Title>
          </Body>
          <Right>
            <NBButton
              testID="saveButton"
              transparent
              disabled={!this.isButtonEnabled()}
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onSendDrop}>
              <Icon
                name="check"
                style={!this.isButtonEnabled() && { color: colors.grey4 }}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <View>
          <List>
            <List.Item
              // arrow="horizontal"
              extra={
                <Text onPress={this._toggleTimePicker}>
                  {format(datetime, 'HH:mm')}
                </Text>
              }>
              <Text style={{ width: '40%' }} onPress={this._toggleDatePicker}>
                {format(datetime, 'D MMM YYYY')}
              </Text>
            </List.Item>
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
            columnWrapperStyle={[styles.columnWrapper]}
            data={products}
            numColumns={3}
            renderItem={this.renderItem}
            style={styles.list}
          />
        </Content>
      </Container>
    );
  }

  renderItem = ({ item: product }: { item: any }) => (
    <View style={styles.row} key={product.key}>
      {product.uploaded ? (
        <View>
          <Image
            source={{ uri: product.photos[0].replace('.jpg', '-thumb.jpg') }}
            style={[styles.size, styles.image]}
          />
          <TouchableOpacity
            onPress={() => this.removeImage(product.key)}
            style={styles.closeWrap}
            activeOpacity={0.6}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : product.next ? (
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
      ) : (
        <View
          style={[
            imagePickerStyle.item,
            styles.size,
            imagePickerStyle.plusWrap,
            imagePickerStyle.plusWrapNormal,
            // { borderColor: colors.grey3 },
          ]}>
          <Text style={imagePickerStyle.plusText}>.</Text>
        </View>
      )}
    </View>
  );
}

const MARGIN = 1;

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
  closeWrap: {
    width: 16,
    height: 16,
    backgroundColor: colors.grey3,
    borderRadius: 8,
    position: 'absolute',
    top: 4 + 5,
    right: 4 + 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
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
  list: {
    flex: 1,
    marginTop: -1,
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
