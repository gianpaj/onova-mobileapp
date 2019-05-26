// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Icon, Left, Right, Container } from 'native-base';
import { WebView } from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { enableRefresh } from '../actions/actionCreator';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, UserData, ReduxState } from '../types';

import { Header, Title } from '../components';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';
import colors from '../config/colors';

function JStoInject() {
  // var originalpostMessage = window.postMessage;

  // var patchedPostMessage = function(message, targetOrigin, transfer) {
  //   originalPostMessage(message, targetOrigin, transfer);
  // };

  // patchedPostMessage.toString = function() {
  //   return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');
  // };

  // window.postMessage = patchedPostMessage;

  // alert('injected');

  function listener(event) {
    if (event.data && event.data.name !== 'Validation') {
      window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
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
  saveBtnDisabled: boolean,
  showFooter: boolean,
  tokenForCardIFrame: string,
};

class EnterCardInfo extends Component<Props, State> {
  keyboardDidShowListener;
  keyboardDidHideListener;
  _webviewRef = React.createRef();
  state = {
    saveBtnDisabled: true,
    showFooter: true,
    tokenForCardIFrame: '',
  };

  async componentDidMount() {
    const { params } = this.props.navigation.state;
    const tokenForCardIFrame = await this.generateTokenForIFrame(params && params.short);
    console.log(tokenForCardIFrame);
    this.setState({ tokenForCardIFrame });
    this.initializeListeners();
  }

  componentWillUnmount() {
    this.keyboardDidShowListener && this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener && this.keyboardDidHideListener.remove();
  }

  initializeListeners() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  _keyboardDidShow = () => this.setState({ showFooter: false });

  _keyboardDidHide = () => this.setState({ showFooter: true });

  async generateTokenForIFrame(short = false) {
    const { data } = await api.get('/api/auth/get-token?shortCard=' + short);
    return data;
  }

  onFinished = async ({ nativeEvent }) => {
    const { userData, token, navigation } = this.props;
    const { params } = navigation.state;
    try {
      const data = JSON.parse(nativeEvent.data);
      // TODO: if TIMEOUT_ERROR reload
      if (data.name !== 'Success') throw Error(data.code);

      await api.put(
        `/api/users/${userData._id}`,
        {
          short: params && params.short,
          paymentInfoPayload: data.payload,
        },
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
        <Image source={require('../assets/images/visa.png')} style={styles.mandatoryImage} resizeMode="contain" />
        <Image source={require('../assets/images/mastercard.png')} style={styles.mandatoryImage} resizeMode="contain" />
        <Image source={require('../assets/images/pci.png')} style={styles.mandatoryImage} resizeMode="contain" />
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

  enableSaveButton = () => this.setState({ saveBtnDisabled: false });

  render() {
    const { showFooter, tokenForCardIFrame, saveBtnDisabled } = this.state;

    if (!tokenForCardIFrame) return null;
    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <Button transparent dark onPress={() => this.props.navigation.goBack()}>
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
            behavior={Platform.select({ android: null, ios: 'padding' })}
            enabled
            style={{
              flex: 1,
              marginTop: 20,
              backgroundColor: colors.bgDefault,
            }}>
            <View style={{ flex: 0.01, minHeight: 260 }}>
              <WebView
                ref={this._webviewRef}
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
                hideKeyboardAccessoryView
                injectedJavaScript={`(${JStoInject.toString()}());`}
                onMessage={this.onFinished}
                scrollEnabled={false} // ios
                startInLoadingState
                onLoadEnd={this.enableSaveButton}
                useWebKit // use WKWebView instead of UIWebView
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
                <Text style={styles.paragraph}>{I18n.t('get_card_id.security')}</Text>
              </View>
            )}
            <View
              style={
                showFooter
                  ? {}
                  : Platform.select({
                      android: {},
                      ios: { flex: 1, bottom: -20 },
                    })
              }>
              <Button
                disabled={saveBtnDisabled}
                full
                style={saveBtnDisabled ? {} : { backgroundColor: colors.active }}
                onPress={this.onSubmit}>
                <Text style={styles.saveBtn}>{I18n.t('checkout.save_card_info')}</Text>
              </Button>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Container>
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

export default connect(mapStateToProps)(EnterCardInfo);
