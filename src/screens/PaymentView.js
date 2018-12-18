// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Keyboard, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Toast } from 'antd-mobile-rn';

import { enableRefresh, disableCancelOrder } from '../actions/actionCreator';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import I18n from '../i18n';

import type { ReduxState } from '../types';

// for development
// const params = { orderId: '5bdb0ced6a7aef00de9da722', cvc: '111' };

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  token: string,
};

type State = {
  payment?: any,
  isLoading: boolean,
  showFooter: boolean,
};

class PaymentView extends Component<Props, State> {
  state = {
    payment: null,
    isLoading: true,
    showFooter: true,
  };

  async componentDidMount() {
    Toast.loading('', 30);
    this.initializeListeners();
    try {
      // const { status } = await this.getPaymentStatus();
      // console.debug(status);
      // if (status === 'ua-finished') {
      //   throw new Error(I18n.t('paymentView.error_payment'));
      // }
      const payment = await this.createPayment();
      console.debug(payment);
      this.setState({ payment, isLoading: false });
    } catch (error) {
      console.debug(error);
      ui.showToast(error.message, 'danger');
      this.props.navigation.goBack();
    }
    Toast.hide();
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
        const { status } = await this.getPaymentStatus();
        transactionStatus = status;
        // console.debug(status);
        await sleep(1000);
      } while (transactionStatus !== 'ua-finished' && retryNum < 30);
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
      this.props.navigation.goBack();
    }
  };

  onSuccess = () => {
    Toast.success(I18n.t('checkout.success_msg'), 10);
    this.props.dispatch(enableRefresh());
    this.props.dispatch(disableCancelOrder());
    // go back to home page
    this.props.navigation.popToTop();
  };

  render() {
    const { payment, showFooter, isLoading } = this.state;

    if (isLoading) return null;

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
                  <script>
                    document.getElementsByTagName('form')[0].submit();
                  </script>
                </form>
              </body></html>`,
          }}
          onNavigationStateChange={async e => {
            if (
              !e.url.startsWith('data:text/html') &&
              e.url.indexOf('/api/payments/') > -1
            ) {
              this.onFinished();
              // console.warn(e);
            }
          }}
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
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(PaymentView);

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
