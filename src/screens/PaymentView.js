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

import type { NavigationScreenProp } from 'react-navigation';
import type { ReduxState, Dispatch } from '../types';

// for development
// const params = { orderId: '5bdb0ced6a7aef00de9da722', cvc: '111' };

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  token: string,
};

type State = {
  payment?: {
    redirectUrl: string,
    PaReq: string,
  },
  isLoading: boolean,
  showFooter: boolean,
};

class PaymentView extends Component<Props, State> {
  keyboardDidHideListener;
  keyboardDidShowListener;

  state = {
    payment: {},
    isLoading: true,
    showFooter: true,
  };

  async componentDidMount() {
    Toast.loading('', 30);
    this.initializeListeners();
    try {
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

  async createPayment(): Promise<any> {
    const { token, navigation } = this.props;
    const { params } = navigation.state;
    const { data } = await api.post(
      `/api/orders/${params.orderId}/pay`,
      { cvc: params.cvc },
      { token }
    );
    return data.payment;
  }

  async getPaymentStatus() {
    const { token, navigation } = this.props;
    const { params } = navigation.state;
    const { data } = await api.get(`/api/orders/${params.orderId}/paymentStatus`, { token });
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
        await ui.sleep(1000);
      } while (transactionStatus !== 'ua-finished' && retryNum < 30);

      // console.debug(transactionStatus);
      Toast.hide();

      // TODO: handle transaction has been already 'paid'
      // if error.code == 'NOT_ALLOWED'
      // return to previous screen (Checkout)
      // TODO: run goToChat() on Checkout or ReplaceCurrentScreen (2 screens)

      if (transactionStatus !== 'ua-finished') {
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
    Toast.success(I18n.t('checkout.success_msg'), 5);
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
