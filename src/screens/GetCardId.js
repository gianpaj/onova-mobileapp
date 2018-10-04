// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, View, WebView } from 'react-native';

import { enableRefresh } from '../actions/actionCreator';

import * as api from '../utils/api';

import type { ReduxState } from '../types';
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
    const { data } = await api.get(`/api/auth/get-token`);
    return data;
  }

  onFinished = async () => {
    const { userData, token } = this.props;
    const paymentInfoPayload =
      'QtDZHvcnhTowyjo6xfLCL591hEm3h8QjNspRq7k5n5VhNN3H9waMRRqhK5DVV1hUkKQF5aTn18a9Rjk47eR8trEvWsr7CrofJ';
    try {
      await api.put(
        `/api/users/${userData._id}`,
        { paymentInfoPayload },
        { token }
      );
      this.props.dispatch(enableRefresh());
      // return to previous screen (Settings or Checkout)
      this.props.navigation.goBack();
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    if (!this.state.tokenForCardIFrame) return null;
    return (
      <View style={{ flex: 1, marginTop: 20 }}>
        <WebView
          originWhitelist={['*']}
          source={{
            // uri: `https://api.demo.uapay.ua/api/iframe/${
            //   this.state.tokenForCardIFrame
            // }`,
            html: `<iframe id="uapayFrame" style="height: 50%; width: 100%" src="https://api.demo.uapay.ua/api/iframe/${
              this.state.tokenForCardIFrame
            }"></iframe><button id="btnSubmit">Створити картку</button>`,
          }}
          injectedJavaScript={`
            (function(){
              var iframe = document.getElementById("uapayFrame").contentWindow;
              var button = document.getElementById("btnSubmit");
              button.addEventListener("click", function(e) {
                console.log('click')
                iframe.postMessage("Submit", "*");
              });
            }());`}
          // injectedJavaScript={'(function(){return "Send me back!"}());'}
          // onMessage={event => alert(event.nativeEvent.data)}
          onNavigationStateChange={event => console.log(event)}
        />
        <Button title="go back" onPress={this.onFinished} />
      </View>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(GetCardId);
