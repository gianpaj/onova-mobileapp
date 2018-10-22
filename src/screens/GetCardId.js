// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { enableRefresh } from '../actions/actionCreator';

import * as api from '../utils/api';
import * as ui from '../utils/ui';

const URL_BASE = 'https://api.stage.uapay.ua';

import type { ReduxState } from '../types';

function JStoInject() {
  // alert('injected');
  var iframe = document.getElementById('uapayFrame').contentWindow;

  var button = document.getElementsByTagName('button')[0];
  button.addEventListener('click', function() {
    iframe.postMessage('Submit', '*');
  });

  function listener(event) {
    if (event.data) {
      window.postMessage(JSON.stringify(event.data));
    }
  }
  window.addEventListener('message', listener, false);
}
class GetCardId extends Component {
  state = {
    tokenForCardIFrame: null,
  };

  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    const tokenForCardIFrame = await this.generateTokenForIFrame();
    console.log(tokenForCardIFrame);
    this.setState({ tokenForCardIFrame });
  }

  async generateTokenForIFrame() {
    const { data } = await api.get('/api/auth/get-token');
    return data;
  }

  onFinished = async data => {
    const { userData, token } = this.props;
    try {
      data = JSON.parse(data);
      // TODO: if TIMEOUT_ERROR reload
      if (data.name === 'Error') throw Error(JSON.stringify(data));
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
      console.error(error);
    }
  };

  render() {
    if (!this.state.tokenForCardIFrame) return null;
    return (
      <View style={{ flex: 1, marginTop: 20 }}>
        <WebView
          source={{
            html: `<html>
              <head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"></head>
              <body>
                <iframe id="uapayFrame" style="border: 0; height: 220px; width: 100%" src="${URL_BASE}/api/iframe/${
              this.state.tokenForCardIFrame
            }"></iframe>
                <button id="btnSubmit">Створити картку</button>
              </body></html>`,
          }}
          injectedJavaScript={`(${JStoInject.toString()}());`}
          onMessage={event => this.onFinished(event.nativeEvent.data)}
        />
        <Button
          title="go back"
          onPress={() => this.props.navigation.goBack()}
        />
      </View>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(GetCardId);
