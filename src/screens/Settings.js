// @flow

import React, { Component } from 'react';

// eslint-disable-next-line import/default
import codePush from 'react-native-code-push';
import { connect } from 'react-redux';
import { Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { Body, Button as NBButton, Container, Content, Icon as NBIcon, Left, Right } from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, FormLabel } from 'react-native-elements';
import type { NavigationScreenProp } from 'react-navigation';
import { Toast } from 'antd-mobile-rn';
import axios from 'axios';
import isEmail from 'validator/lib/isEmail';
import update from 'immutability-helper';
import { KeyboardAccessoryNavigation } from 'react-native-keyboard-accessory';
import { URL } from 'react-native-dotenv';
import Dialog from 'react-native-dialog';
// import Instabug from 'instabug-reactnative';

import { Accordion, CardView, Header, HR, SearchableDropdown, Title, Info } from '../components';

import { disableRefresh, getPersonalUserData, logout } from '../actions/actionCreator';

import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import { validPassword, validShippingAddress, isPhoneNumberValid } from '../utils/validators';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import * as linking from '../utils/linking';

import { version } from '../../package.json';

if (!Object.is) {
  Object.is = function(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    }
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  };
}

// regexr.com/42aoo
// allow empty string || cyrillic chars with whitespaces
const cyrillicRegex = /^$|^[\u0400-\u04FF\s]+$/;

import type { City, Department, UserData, Dispatch, PaymentInfo, ShippingAddress, ReduxState } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  shouldRefresh?: boolean,
  skippedLogin?: boolean,
  token: string,
  userData: UserData,
};

type State = {
  accordionExpanded: boolean,
  activeInputRef: any,
  cities: ?Array<City>,
  codePushVersion: string,
  departments: ?Array<Department>,
  dialogInfoVisible: boolean,
  emailAddress: string,
  instagram: string,
  instagramError: boolean,
  isLoading: boolean,
  mobileNumber: string,
  nextFocusDisabled: boolean,
  password: string,
  pending: boolean,
  previousFocusDisabled: boolean,
  shippingAddress: ?ShippingAddress,
  username: string,
  usernameError: boolean,
};

class SettingsContainer extends Component<Props, State> {
  cancelToken;
  didFocusListener;
  inputs: Array<any> = [];
  state = {
    accordionExpanded: false,
    activeInputRef: null,
    cities: null,
    codePushVersion: '',
    departments: null,
    dialogInfoVisible: false,
    emailAddress: '',
    instagram: '',
    instagramError: false,
    isLoading: true,
    mobileNumber: '',
    nextFocusDisabled: false,
    password: '',
    pending: false,
    previousFocusDisabled: false,
    shippingAddress: null,
    username: '',
    usernameError: false,
  };

  async componentDidMount() {
    await this.refresh();

    this.didFocusListener = this.props.navigation.addListener('didFocus', () => {
      if (this.props.shouldRefresh) {
        this.refresh();
        this.props.dispatch(disableRefresh());
      }
    });
    // Instabug.startWithToken(
    //   settings.INSTABUG_TOKEN,
    //   Instabug.invocationEvent.none
    // );
    // Instabug.setPromptOptionsEnabled(false, true, true);

    const cities = await api.getCities(this.props.token);
    this.setState({ cities });

    if (this.state.shippingAddress && this.state.shippingAddress.city) {
      const departments = await api.getDepartments(this.state.shippingAddress.city);
      this.setState({ departments });
    }
    const update = await codePush.getUpdateMetadata();
    if (update) this.setState({ isLoading: false, codePushVersion: update.label });
    else this.setState({ isLoading: false, codePushVersion: 'debug' });

    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  refresh = () => {
    if (this.props.skippedLogin) return;
    const CancelToken = axios.CancelToken;
    this.cancelToken = CancelToken.source();
    return this.props.dispatch(getPersonalUserData({ cancelToken: this.cancelToken.token }));
  };

  componentWillUnmount() {
    // trigger Axios to reject the request
    this.cancelToken && this.cancelToken.cancel('operation_canceled');
    this.didFocusListener && this.didFocusListener.remove();
  }

  static getDerivedStateFromProps(props, state) {
    if (state.isLoading) {
      const { userData } = props;
      return {
        emailAddress: userData.emailAddress,
        mobileNumber: userData.mobileNumber,
        shippingAddress: userData.shippingAddress,
        username: userData.username,
        ...{ instagram: userData.scraping ? userData.scraping.instagram : {} },
      };
    }

    // Return null to indicate no change to state.
    return null;
  }

  /**
   * return true if there are any valid and unsaved changes to be able to save them
   */
  hasUnsavedChanges = (): boolean => {
    const { userData } = this.props;
    const {
      cities,
      departments,
      emailAddress,
      instagram,
      mobileNumber,
      password,
      pending,
      shippingAddress,
      username,
    } = this.state;

    const mobileNumberClean = mobileNumber.replace(/\D+/g, '');

    const isShippingAddressValidIfUpdated =
      shippingAddress &&
      shippingAddress.city &&
      (shippingAddress.city !== userData.shippingAddress.city ||
        shippingAddress.firstName !== userData.shippingAddress.firstName ||
        shippingAddress.lastName !== userData.shippingAddress.lastName ||
        shippingAddress.departmentNovaposhta !== userData.shippingAddress.departmentNovaposhta) &&
      cities &&
      validShippingAddress(shippingAddress, cities, departments);

    const isMobilePhoneUpdatedOrCleared = mobileNumberClean
      ? mobileNumberClean !== userData.mobileNumber && isPhoneNumberValid(mobileNumber)
      : userData.mobileNumber;

    const isIGUsernameUpdatedOrCleared = instagram
      ? instagram !== userData.scraping.instagram
      : userData.scraping && userData.scraping.instagram;

    return Boolean(
      !pending &&
        (isShippingAddressValidIfUpdated ||
          (password && validPassword(password)) ||
          isMobilePhoneUpdatedOrCleared ||
          (isEmail(emailAddress) && emailAddress !== userData.emailAddress) ||
          (username !== '' && username !== userData.username) ||
          isIGUsernameUpdatedOrCleared)
    );
  };

  onSave = () => {
    const { userData, token } = this.props;
    const { emailAddress, mobileNumber, password, shippingAddress, username, instagram } = this.state;
    const data = {};

    this.setState({ pending: true });

    data.instagram = instagram;

    if (username !== '') data.username = username;

    if (password !== '') data.password = password;

    if (emailAddress !== userData.emailAddress) {
      data.emailAddress = emailAddress;
    }

    // if (validShippingAddress(shippingAddress)) {
    data.shippingAddress = shippingAddress;
    // }

    // FIXME: state should be the number unformatted. useful also when comparing if number has been changed
    if (typeof mobileNumber === 'string') {
      data.mobileNumber = mobileNumber.replace(/\D/g, '');
    }

    // console.log(data);

    Toast.loading(I18n.t('alerts.loading_message'), 3);

    api
      .put(`/api/users/${userData._id}`, data, { token })
      .then(() => {
        // console.log(res);
        // if we changed the email
        if (data.emailAddress) {
          ui.showToast(I18n.t('settings.alert_msg_email_address_changed'), 'success');
        } else {
          ui.showToast(I18n.t('settings.alert_msg_settigs_changed'), 'success');
        }
        this.goBack();
      })
      .catch(err => {
        console.debug(err);
        ui.showToast(err.message, 'danger');
      })
      // final
      .then(() => {
        Toast.hide();
        this.setState({ pending: false });
      });
  };

  onIGChange = (instagram: string) => {
    if (!settings.USERNAME_REGEX.test(instagram)) {
      this.setState({ instagramError: true });

      setTimeout(() => {
        this.setState({ instagramError: false });
      }, 100);
    }

    return this.setState({ instagram });
  };

  onUserChange = (username: string) => {
    if (!settings.USERNAME_REGEX.test(username)) {
      this.setState({ usernameError: true });

      setTimeout(() => {
        this.setState({ usernameError: false });
      }, 100);
    }

    return this.setState({ username });
  };

  onSignout = () => this.props.dispatch(logout());

  formatCardInfo() {
    const { paymentInfo }: { paymentInfo: PaymentInfo } = this.props.userData;

    number = '**** **** **** ****';
    if (paymentInfo) {
      const { full, short } = paymentInfo;
      if (short && short.first_four) number = `${short.first_four} **** **** ${short.last_four}`;
      if (full && full.first_four) number = `${full.first_four} **** **** ${full.last_four}`;
    }

    return {
      number,
      scale: 0.5,
    };
  }

  handleFocus = (ref: number) =>
    this.setState({
      activeInputRef: ref,
      previousFocusDisabled: ref === 0,
      nextFocusDisabled: ref === 8,
    });

  changeInputFocus(direction: number = 1) {
    if ((this.state.nextFocusDisabled && direction === 1) || (this.state.previousFocusDisabled && direction === -1)) {
      return;
    }
    const focusingRef = this.state.activeInputRef + direction;

    // open the accordion if the field selected is firstName...mobileNumber
    // close if Instagram username, etc.
    this.toggleAccordion(focusingRef < 5);

    this.inputs[focusingRef] && this.inputs[focusingRef].focus();
  }

  enterPaymentInfo = () => {
    const { skippedLogin, navigation } = this.props;

    if (skippedLogin) return navigation.navigate('inAppAuth');

    navigation.navigate({
      routeName: 'enterCardInfo',
      key: 'enterCardInfo',
      params: { short: true },
    });
  };

  _renderCityAutocomplete = props => {
    const { pending, cities, shippingAddress } = this.state;
    const { skippedLogin } = this.props;

    return (
      <SearchableDropdown
        refProp={el => (this.inputs[2] = el)}
        onItemSelect={async ({ id }) => {
          if (!id) this.setState({ departments: [] });
          else {
            const departments = await api.getDepartments(id);
            this.setState({ departments });
            // Automatically focus on Department InputItem
            this.inputs[3].focus();
          }

          // reset the department field after selecting a new city
          if (shippingAddress.city !== id) this.autoCompleteRef.onChangeText('');

          this.setState(update(this.state, { shippingAddress: { city: { $set: id } } }));
        }}
        disabled={pending || skippedLogin}
        itemsContainerStyle={styles.autocompleteItemContainers}
        itemStyle={styles.autocompleteItems}
        // TODO: color in red if !cities.indexOf(query)
        inputContainerStyle={styles.autocompleteContainers}
        items={cities}
        regexToMatch={cyrillicRegex}
        {...props}
      />
    );
  };

  _renderDepartmentAutocomplete = props => {
    const { pending, shippingAddress, departments, cities } = this.state;
    const { skippedLogin } = this.props;

    const city = cities.find(city => city.id === shippingAddress.city);
    return (
      <SearchableDropdown
        ref={el => (this.autoCompleteRef = el)}
        refProp={el => (this.inputs[3] = el)}
        onItemSelect={({ id }) =>
          this.setState(update(this.state, { shippingAddress: { departmentNovaposhta: { $set: id } } }))
        }
        disabled={!departments || pending || skippedLogin}
        // TODO: color in red if !department.indexOf(query)
        inputContainerStyle={styles.autocompleteContainers}
        itemsContainerStyle={styles.autocompleteItemContainers}
        itemStyle={styles.autocompleteItems}
        items={departments}
        extra={!city && <Text>{I18n.t('checkout.department_requirement_right')}</Text>}
        {...props}
      />
    );
  };

  goBack = () => this.props.navigation && this.props.navigation.goBack();

  toggleAccordion = value =>
    this.setState({ accordionExpanded: typeof value === 'boolean' ? value : !this.state.accordionExpanded });

  toggleInfoDialog = () => this.setState(prevState => ({ dialogInfoVisible: !prevState.dialogInfoVisible }));

  renderInfoDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.dialogInfoVisible}
        onBackdropPress={this.toggleInfoDialog}
        onBackButtonPress={this.toggleInfoDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Title>{I18n.t('settings.instagram_label')}</Dialog.Title>
        <Dialog.Description style={{ textAlign: 'left' }}>{I18n.t('settings.ig_info_dialog')}</Dialog.Description>
        <Dialog.Button label={I18n.t('product.toast_warning_ok_button')} onPress={this.toggleInfoDialog} />
      </Dialog.Container>
    </React.Fragment>
  );

  render() {
    const { userData, skippedLogin } = this.props;
    const {
      accordionExpanded,
      cities,
      codePushVersion,
      departments,
      emailAddress,
      instagram,
      instagramError,
      isLoading,
      mobileNumber = '',
      password,
      pending,
      shippingAddress,
      username,
      usernameError,
    } = this.state;

    if (isLoading || !userData) return null;

    const inputProps = {
      autoCapitalize: 'none',
      autoCorrect: false,
      clearButtonMode: 'while-editing',
      containerStyle: styles.inputContainer,
      editable: !pending && !skippedLogin,
      inputStyle: styles.input,
    };

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <NBButton transparent dark onPress={this.goBack}>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title>{I18n.t('settings.header')}</Title>
          </Body>
          <Right>
            <NBButton
              transparent
              disabled={!this.hasUnsavedChanges()}
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onSave}>
              <Icon name="check" style={!this.hasUnsavedChanges() && { color: colors.grey4 }} size={28} />
            </NBButton>
          </Right>
        </Header>
        <Content>
          <View style={styles.padder}>
            <Accordion
              expanded={accordionExpanded}
              // TODO: auto expand if the shipping address fields are invalid or not valid
              headerText={I18n.t('userInfo.shippingAddress')}
              values={[
                {
                  ref: el => (this.inputs[0] = el),
                  placeholder: I18n.t('userInfo.firstName'),
                  value: shippingAddress.firstName,
                  editable: !pending && !skippedLogin,
                  onFocus: this.handleFocus.bind(this, 0),
                  onSubmitEditing: () => this.changeInputFocus(1),
                  onChangeText: t => {
                    if (cyrillicRegex.test(t))
                      this.setState(update(this.state, { shippingAddress: { firstName: { $set: t } } }));
                  },
                  textContentType: 'givenName',
                },
                {
                  ref: el => (this.inputs[1] = el),
                  placeholder: I18n.t('userInfo.lastName'),
                  value: shippingAddress.lastName,
                  editable: !pending && !skippedLogin,
                  onFocus: this.handleFocus.bind(this, 1),
                  onSubmitEditing: () => this.changeInputFocus(1),
                  onChangeText: t => {
                    if (cyrillicRegex.test(t))
                      this.setState(update(this.state, { shippingAddress: { lastName: { $set: t } } }));
                  },
                  textContentType: 'streetAddressLine2',
                },
                {
                  placeholder: I18n.t('userInfo.city'),
                  value: cities.find(city => city.id === shippingAddress.city),
                  onFocus: this.handleFocus.bind(this, 2),
                  onSubmitEditing: () => this.changeInputFocus(1),
                  // textContentType: 'addressCity',
                  render: this._renderCityAutocomplete,
                },
                {
                  placeholder: I18n.t('userInfo.department'),
                  onFocus: this.handleFocus.bind(this, 3),
                  onSubmitEditing: () => this.changeInputFocus(1),
                  value: departments && departments.find(d => d.id === shippingAddress.departmentNovaposhta),
                  render: this._renderDepartmentAutocomplete,
                },
                {
                  ref: el => (this.inputs[4] = el),
                  placeholder: I18n.t('userInfo.mobileNumber'),
                  value: ui.formatPhoneNumber(mobileNumber),
                  editable: !pending && !skippedLogin,
                  onFocus: this.handleFocus.bind(this, 4),
                  onChangeText: t => this.setState({ mobileNumber: t }),
                  type: 'phone',
                  shouldShowError: () => (mobileNumber ? isPhoneNumberValid(mobileNumber) : true),
                  textContentType: 'telephoneNumber',
                },
              ]}
            />
            <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>{I18n.t('userInfo.paymentInfo')}</FormLabel>
            <View style={{ alignSelf: 'center' }}>
              <TouchableOpacity onPress={this.enterPaymentInfo}>
                {Object.keys(userData.paymentInfo.short).length || Object.keys(userData.paymentInfo.full).length ? (
                  <CardView {...this.formatCardInfo()} focused="number" />
                ) : (
                  <CardView {...this.formatCardInfo()} />
                )}
              </TouchableOpacity>
            </View>
            {/* <View style={styles.padder}> */}
            {/* <Text style={[styles.padder, styles.secureText]}> */}
            {/* Your data is secured with a 2048-bit encryption SSL certificate */}
            {/* for More info please refer to the FAQ */}
            {/* </Text> */}
            {/* </View> */}
          </View>
          <View style={styles.padder}>
            <View style={styles.flexRow}>
              <FormLabel containerStyle={{}} labelStyle={styles.label}>
                {I18n.t('settings.instagram_label')}
              </FormLabel>
              <Info color={colors.black} style={styles.infoIcon} onPress={this.toggleInfoDialog} />
            </View>
            <FormInput
              ref={el => (this.inputs[5] = el)}
              onChangeText={this.onIGChange}
              placeholder={I18n.t('settings.instagram_placeholder')}
              value={instagram}
              shake={instagramError}
              onFocus={this.handleFocus.bind(this, 5)}
              onSubmitEditing={this.changeInputFocus.bind(this, 1)}
              {...inputProps}
            />
            <FormLabel labelStyle={styles.label}>{I18n.t('settings.username_label')}</FormLabel>
            <FormInput
              ref={el => (this.inputs[6] = el)}
              onChangeText={this.onUserChange}
              placeholder={I18n.t('settings.username_placeholder')}
              value={username}
              shake={usernameError}
              onFocus={this.handleFocus.bind(this, 6)}
              onSubmitEditing={this.changeInputFocus.bind(this, 1)}
              {...inputProps}
            />
            <FormLabel labelStyle={styles.label}>{I18n.t('settings.email_label')}</FormLabel>
            <FormInput
              ref={el => (this.inputs[7] = el)}
              onChangeText={t => this.setState({ emailAddress: t })}
              placeholder={I18n.t('settings.email_placeholder')}
              value={emailAddress}
              onFocus={this.handleFocus.bind(this, 7)}
              onSubmitEditing={this.changeInputFocus.bind(this, 1)}
              {...inputProps}
            />
            <FormLabel labelStyle={styles.label}>{I18n.t('settings.password_label')}</FormLabel>
            <FormInput
              disa
              ref={el => (this.inputs[8] = el)}
              onChangeText={t => this.setState({ password: t })}
              secureTextEntry
              placeholder={I18n.t('settings.password_placeholder')}
              value={password}
              onFocus={this.handleFocus.bind(this, 8)}
              {...inputProps}
            />
            <HR full />
            <TouchableOpacity
              style={{
                marginVertical: 15,
                marginHorizontal: 20,
                width: '40%',
              }}
              hitSlop={linkHitSlop}
              accessibilityRole="link"
              onPress={linking.openURL.bind(this, `https://${URL}/faq.html`)}>
              <Text style={styles.labelLink}>{I18n.t('settings.faq')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginVertical: 15, marginHorizontal: 20, width: '70%' }}
              hitSlop={linkHitSlop}
              accessibilityRole="link"
              onPress={() => this.props.navigation.navigate('markdownDoc')}>
              <Text style={styles.labelLink}>{I18n.t('settings.safe_purchase_rules')}</Text>
            </TouchableOpacity>
          </View>
          {/* TODO: add Notifications switch */}
          {/* You only get notifications for messages and status updates in your sales or purchases.
            We won't distract when you get new followers and other non-important matters */}
          <View style={[styles.padder, { alignItems: 'center' }]}>
            <NBButton light full onPress={this.onSignout}>
              <Text>{I18n.t('settings.sign_out_button')}</Text>
            </NBButton>
            <TouchableOpacity
              style={styles.padder}
              accessibilityRole="link"
              onPress={linking.email.bind(this, `mailto:hello@${URL}`)}>
              <Text style={styles.centerText}>
                hello@
                {URL}
              </Text>
            </TouchableOpacity>
            <Text style={styles.centerText}>
              {version} - {codePushVersion}
            </Text>
          </View>
          {/* <HR full /> */}
          {/* <NBButton light full onPress={() => Instabug.invoke()}>
            <Text>Report a problem or suggest an improvement</Text>
          </NBButton> */}
        </Content>
        {Platform.OS == 'ios' && (
          <KeyboardAccessoryNavigation
            nextDisabled={this.state.nextFocusDisabled}
            previousDisabled={this.state.previousFocusDisabled}
            onNext={this.changeInputFocus.bind(this, 1)}
            onPrevious={this.changeInputFocus.bind(this, -1)}
          />
        )}
        {this.renderInfoDialog()}
      </Container>
    );
  }
}

const linkHitSlop = { top: 10, left: 5, bottom: 10, right: 10 };

const styles = StyleSheet.create({
  autocompleteContainers: {
    borderBottomWidth: 0,
  },
  autocompleteItemContainers: {
    // top: -30,
    // backgroundColor: colors.white,
    // zIndex: 10,
    alignSelf: 'center',
    borderColor: colors.grey4,
    borderRadius: 2,
    borderWidth: 1,
    width: 323,
  },
  autocompleteItems: {
    marginHorizontal: 10,
    marginTop: 2,
    paddingHorizontal: 5,
    paddingVertical: 10,
    // backgroundColor: colors.grey6,
  },
  centerText: {
    color: colors.grey4,
    paddingVertical: 10,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  flexRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 18,
  },
  infoIcon: {
    height: '100%',
    paddingBottom: 0,
    paddingTop: 0,
  },
  input: {
    color: colors.black,
    width: '100%',
  },
  inputContainer: {
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  label: {
    color: colors.black,
    fontWeight: '600',
  },
  labelLink: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '600',
  },
  padder: {
    padding: 10,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  skippedLogin: state.LoginReducer.skippedLogin,
  token: state.LoginReducer.token,
  shouldRefresh: state.RefresherReducer.shouldRefresh,
});

export const Settings = connect(mapStateToProps)(SettingsContainer);
