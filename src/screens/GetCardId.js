// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Body, Button, Header, Icon, Left, Title, Right } from 'native-base';
import { WebView } from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { enableRefresh } from '../actions/actionCreator';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, UserData, ReduxState } from '../types';

import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';
import colors from '../config/colors';

function JStoInject() {
  var originalPostMessage = window.postMessage;

  var patchedPostMessage = function(message, targetOrigin, transfer) {
    originalPostMessage(message, targetOrigin, transfer);
  };

  patchedPostMessage.toString = function() {
    return String(Object.hasOwnProperty).replace(
      'hasOwnProperty',
      'postMessage'
    );
  };

  window.postMessage = patchedPostMessage;

  // alert('injected');

  function listener(event) {
    if (event.data && event.data.name !== 'Validation') {
      window.postMessage(JSON.stringify(event.data));
    }
  }
  window.addEventListener('message', listener, false);
}

type Props = {
  dispatch: Dispatch,
  navigation: NavigationScreenProp<*>,
  token: string,
  userData: UserData,
};

type State = {
  showFooter: boolean,
  tokenForCardIFrame: string,
};

class GetCardId extends Component<Props, State> {
  keyboardDidShowListener;
  keyboardDidHideListener;
  _webviewRef = React.createRef();
  state = {
    tokenForCardIFrame: '',
    showFooter: true,
  };

  async componentDidMount() {
    const tokenForCardIFrame = await this.generateTokenForIFrame();
    console.log(tokenForCardIFrame);
    this.setState({ tokenForCardIFrame });
    this.initializeListeners();
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  initializeListeners() {
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide
    );
  }

  _keyboardDidShow = () => this.setState({ showFooter: false });

  _keyboardDidHide = () => this.setState({ showFooter: true });

  async generateTokenForIFrame() {
    const { data } = await api.get('/api/auth/get-token');
    return data;
  }

  onFinished = async data => {
    const { userData, token } = this.props;
    try {
      data = JSON.parse(data);
      // TODO: if TIMEOUT_ERROR reload
      if (data.name !== 'Success') throw Error(data);

      await api.put(
        `/api/users/${userData._id}`,
        { paymentInfoPayload: data.payload },
        { token }
      );
      this.props.dispatch(enableRefresh());
      // return to previous screen (Settings or Checkout)
      this.props.navigation.goBack();
    } catch (error) {
      ui.showToast(error.message, 'danger');
      console.error(JSON.stringify(error));
    }
  };

  renderMandatory() {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          paddingBottom: 10,
          marginTop: -40,
          justifyContent: 'center',
        }}>
        <Image
          source={require('../assets/images/visa.png')}
          style={styles.mandatoryImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/mastercard.png')}
          style={styles.mandatoryImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/pci.png')}
          style={styles.mandatoryImage}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/uapay.png')}
          style={[styles.mandatoryImage, { width: '15%' }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  onSubmit = () => {
    function script() {
      var iframe = document.getElementById('uapayFrame').contentWindow;

      // alert('click');
      iframe.postMessage('Submit', '*');
    }
    this._webviewRef.current.injectJavaScript(`(${script.toString()}());`);
  };

  render() {
    const { showFooter, tokenForCardIFrame } = this.state;

    if (!tokenForCardIFrame) return null;
    return (
      <View style={{ flex: 1 }}>
        <Header>
          <Left style={styles.container}>
            <Button
              transparent
              dark
              onPress={() => this.props.navigation.goBack()}>
              <Icon ios="ios-arrow-back" android="md-arrow-back" />
            </Button>
          </Left>
          <Body style={styles.container}>
            <Title>{I18n.t('get_card_id.title')}</Title>
          </Body>
          <Right />
        </Header>
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior="padding"
            enabled
            style={{
              flex: 1,
              marginTop: 20,
              backgroundColor: colors.bgDefault,
            }}>
            <View style={{ flex: 0.01, minHeight: 260 }}>
              <WebView
                ref={this._webviewRef}
                useWebKit={false}
                source={{
                  html: `<html>
                    <head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"></head>
                    <body style="background: white; margin-bottom: -5px">
                      <iframe id="uapayFrame" style="border: 0; height: 220px; width: 100%" src="${
                        api.config.URL_BASE
                      }/api/iframe/${tokenForCardIFrame}"></iframe>
                    </body>
                  </html>`,
                }}
                injectedJavaScript={`(${JStoInject.toString()}());`}
                onMessage={event => this.onFinished(event.nativeEvent.data)}
                scrollEnabled={false} // ios
                startInLoadingState
              />
            </View>
            {this.renderMandatory()}
            {showFooter && (
              <View style={{ flex: 2 }}>
                <MaterialCommunityIcons
                  color={colors.black}
                  name="shield-lock"
                  size={64}
                  style={{ alignSelf: 'center' }}
                />
                <Text style={styles.paragraph}>
                  {I18n.t('get_card_id.security')}
                </Text>
              </View>
            )}
            <Button full style={{ color: colors.red }} onPress={this.onSubmit}>
              <Text style={styles.saveBtn}>
                {I18n.t('checkout.save_card_info')}
              </Text>
            </Button>
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  saveBtn: {
    color: colors.white,
    fontWeight: '600',
    fontSize: Platform.select({
      android: 18,
      ios: 16,
    }),
  },
  mandatoryImage: {
    margin: 10,
    width: '20%',
    height: 50,
  },
  paragraph: {
    color: colors.grey1,
    fontWeight: '500',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 15,
  },
});

export default connect(mapStateToProps)(GetCardId);
