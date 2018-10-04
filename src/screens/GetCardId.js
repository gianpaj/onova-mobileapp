// @flow

import React, { Component } from 'react';
import { Button, View, WebView } from 'react-native';
import { withNavigation } from 'react-navigation';

import * as api from '../utils/api';

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

  onFinished = () => {
    this.props.navigation.goBack();
    // return to previous screen (Settings or Checkout)
  };

  render() {
    if (!this.state.tokenForCardIFrame) return null;
    return (
      <View style={{ flex: 1 }}>
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
          style={{ flex: 1, marginTop: 20 }}
        />
        <Button title="go back" onPress={this.onFinished} />
      </View>
    );
  }
}

export default withNavigation(GetCardId);
