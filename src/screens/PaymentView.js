// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Toast } from 'antd-mobile-rn';

import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';

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
      const { status } = await this.getPaymentStatus();
      console.debug(status);
      if (status === 'ua-finished') {
        ui.showToast('Payment has been already completed', 'danger');
        return this.props.navigation.goBack();
      }
      const payment = await this.createPayment();
      console.debug(payment);
      this.setState({ payment, isLoading: false });
    } catch (error) {
      console.error(error);
      ui.showToast(error.message, 'danger');
    }
  }

  createPayment(): Promise<any> {
    const { token } = this.props;
    const { params } = this.props.navigation.state;
    return new Promise((resolve, reject) => {
      api
        .post(
          `/api/orders/${params.orderId}/pay`,
          { cvc: params.cvc },
          { token }
        )
        .then(({ data }) => {
          console.debug(data);
          resolve(data.payment);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  async getPaymentStatus() {
    const { token } = this.props;
    const { params } = this.props.navigation.state;
    const { data } = await api.get(
      `/api/orders/${params.orderId}/paymentStatus`,
      { token }
    );
    return data;
  }

  onFinished = async () => {
    try {
      Toast.loading('', 30);

      // retry for x amount of times with 1 sec in between until payment status is finished
      let retryNum = 0;
      let transactionStatus;
      do {
        retryNum++;
        let { status } = await this.getPaymentStatus();
        transactionStatus = status;
        // console.debug(status);
        await sleep(1000);
      } while (transactionStatus !== 'ua-finished' || retryNum > 4);
      // if it should be

      // console.debug(transactionStatus);
      Toast.hide();

      // TODO: handle transaction has been already 'paid'
      // if error.code == 'NOT_ALLOWED'
      // return to previous screen (Checkout)
      // TODO: run goToChat() on Checkout or ReplaceCurrentScreen (2 screens)
      if (transactionStatus !== 'ua-finished') {
        // ui.showToast('Timeout', 'warning', 'OK', 4);
        // retry?
        throw new Error('Timeout issue confirming payment finished');
      }
      this.onSuccess();
    } catch (error) {
      ui.showToast(error.message, 'danger');
      console.error(error);
    }
  };

  onSuccess = () => {
    Toast.success(I18n.t('checkout.success_msg'), 5);
    // go back to home page
    this.props.navigation.popToTop();
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
          onNavigationStateChange={async e => {
            if (
              !e.url.startsWith('data:text/html') &&
              e.url.indexOf('/api/payments/') > -1
            ) {
              await sleep(3000); // TODO: remove after testing
              this.onFinished();
              // console.warn(e);
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

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(PaymentView);
