// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Keyboard, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { enableRefresh } from '../actions/actionCreator';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, UserData, ReduxState } from '../types';

import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';

const URL_BASE = 'https://api.uapay.ua';

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
  var iframe = document.getElementById('uapayFrame').contentWindow;

  var button = document.getElementsByTagName('button')[0];
  button.addEventListener('click', function() {
    iframe.postMessage('Submit', '*');
  });

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

  render() {
    const { showFooter, tokenForCardIFrame } = this.state;

    if (!tokenForCardIFrame) return null;
    return (
      <View style={{ flex: 1, marginTop: 20 }}>
        <WebView
          useWebKit={false}
          source={{
            html: `<html>
              <head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"></head>
              <body>
                <iframe id="uapayFrame" style="border: 0; height: 220px; width: 100%" src="${URL_BASE}/api/iframe/${tokenForCardIFrame}"></iframe>
                <button id="btnSubmit">${I18n.t(
                  'checkout.save_card_info'
                )}</button>
              </body></html>`,
          }}
          injectedJavaScript={`(${JStoInject.toString()}());`}
          onMessage={event => this.onFinished(event.nativeEvent.data)}
          scrollEnabled={false} // ios
          startInLoadingState
        />
        {showFooter && (
          <Button
            title={I18n.t('checkout.go_back')}
            onPress={() => this.props.navigation.goBack()}
          />
        )}
      </View>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(GetCardId);
