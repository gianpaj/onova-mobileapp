// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { enableRefresh } from '../actions/actionCreator';

import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { ReduxState } from '../types';

function JStoInject() {
  // alert('injected');

  var button = document.getElementsByTagName('button')[0];
  button.click();

  // function listener(event) {
  //   if (event.data) {
  //     window.postMessage(JSON.stringify(event.data));
  //   }
  // }
  // window.addEventListener('message', listener, false);
}
class PaymentView extends Component {
  state = {
    isLoading: true,
  };

  async componentDidMount() {
    try {
      const { params } = this.props.navigation.state;
      // const payment = await this.createPayment(params.orderId);
      let payment = {
        PaReq:
          'eJxVUttOwzAMfd5fVHxAc+ttUxZpsAcm0WlAeUZVZ7ECy0rSAvt77HSbRqSoto/t9BxbVzsHsHyGZnBgdAne128Qtdv5zWbxBF+vIk245KlKRSKTGzPRIWwmE/0NzrcHa0TMY6nZ2UWkq61JRVbkaa4ypXimZK4ZRREswTW72vZoT3TdfN2u1iaV2TQTmp1cQvbgVkvDxyPHD2aMYUqw9R5MBb6Pzh2jqvYPrf2INAsgZTWHwfbuaAqeaHZ2CBjcp9n1fTdjTMgcKfBYzBQeVm5W7Al8d7AeNu7QoCStfYvffacZVWExuyKhNwPZfnzvt92asnrh5XL1s65KUVaPx/Vy8VOOd64ZZVDmtu7BSC4KwaWMhJol05lAhiEetNnT7xrBs5hz1GZ0CenoxcUFJvQ6FHgPzoFtjmZaIHrxCIJfpAaYh0O72ETqioi+uz/Np+lRb8VzIWWukrSgIYXYqVWLekrJVejVBnE1o2rsFzaFxApLhda/ZfsDipm53Q==',
        redirectUrl:
          'https://api.escrowbox.stage.uapay.ua/api/payments/1297/confirmations',
      };
      console.log(payment);
      this.setState({ payment, isLoading: false });
    } catch (error) {
      console.error(error);
      ui.showToast(error.message, 'danger');
    }
  }

  createPayment(orderId: string): Promise<any> {
    const { token } = this.props;
    return new Promise((resolve, reject) => {
      api
        .post(`/api/orders/${orderId}/pay`, null, { token })
        .then(({ data }) => {
          console.debug(data);
          resolve(data.payment);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  onFinished = async () => {
    const { userData, token } = this.props;
    const { params } = this.props.navigation.state;
    try {
      // await api.put(`/api/orders/${params.orderId}/check`, null, { token });

      // TODO: handle transaction has been already 'paid'
      // if error.code == 'NOT_ALLOWED'
      // return to previous screen (Checkout)
      // TODO: run goToChat() on Checkout or ReplaceCurrentScreen (2 screens)
      this.props.navigation.goBack();
    } catch (error) {
      ui.showToast(error.message, 'danger');
      console.error(error);
    }
  };

  render() {
    if (this.state.isLoading) return null;

    const { payment } = this.state;

    return (
      <View style={{ flex: 1, marginTop: 20 }}>
        <WebView
          source={{
            html: `<html>
              <head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"></head>
              <body>
                <form action="https://acs.privatbank.ua/pPaReqMC.jsp" method="POST">
                  <input name="TermUrl" value="${
                    payment.redirectUrl
                  }" type="hidden" /><br>
                  <input name="PaReq" value="${
                    payment.PaReq
                  }" type="hidden" /><br>
                  <button style="display: none;">Submit</button>
                </form>
              </body></html>`,
          }}
          injectedJavaScript={`(${JStoInject.toString()}());`}
          onNavigationStateChange={e => {
            if (e.url.indexOf('/api/payments/') > -1) {
              this.onFinished();
              console.warn(e);
            }
          }}
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

export default connect(mapStateToProps)(PaymentView);
