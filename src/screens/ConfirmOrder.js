// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Body,
  Button,
  Container,
  Content,
  Icon,
  Left,
  Right,
} from 'native-base';
import { Toast } from 'antd-mobile-rn';
import Foect from 'foect';

import { Avatar, Header, Title } from '../components';

import I18n from '../i18n';
import colors from '../config/colors';
import typography from '../config/typography';
import settings from '../config/settings';
import * as api from '../utils/api';
import * as ui from '../utils/ui';

import type { NavigationScreenProp } from 'react-navigation';
import type { Order, UserData, ReduxState } from '../types';

type Props = {
  navigation: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  isLoading: boolean,
  order: Order,
};

export class ConfirmOrderContainer extends Component<Props, State> {
  state = {
    isLoading: true,
    order: null,
  };

  async componentDidMount() {
    const { token } = this.props;
    const { _id } = this.props.userData;
    const params = this.props.navigation.state.params;
    // for development
    let orderId = '5bceeb77d9777b1b05089c9f';

    if (params) {
      orderId = params.id;
    }

    try {
      const order: Order = await api.getOrder(orderId, token);
      console.debug(order);
      // const iAmTheSeller = _id.toString() === order.seller._id.toString();

      this.setState({ isLoading: false, order });
    } catch (err) {
      console.log(err);
      Toast.fail(err.message, 5);
      // this.goBackAndRefresh();
    }
  }

  onConfirm = async () => {
    const { order } = this.state;
    const { token } = this.props;

    let body = {
      orderId: order.id,
    };
    try {
      const { data } = await api.post(
        `/api/users/${this.props.userData._id}/reviews`,
        body,
        {
          token,
        }
      );
      console.debug(data);
      Toast.success(
        "Awesome let's continue and get you the tracking number!",
        5
      );
      this.goBackAndRefresh();
    } catch (err) {
      Toast.fail(err.message, 3);
      console.log(err);
    }
  };

  goBackAndRefresh() {
    this.props.navigation.state.params.shouldRefresh(true);
    this.props.navigation.goBack();
  }

  goToProfile = (user: UserData) => {
    let routeName = 'profileInStack';
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName,
      params: user,
      key: `profile-${user.username}`,
    });
  };

  render() {
    const { isLoading, order } = this.state;
    if (isLoading || !order) return null;

    const uri = order.product.photoURIs[0].replace('.jpg', '-thumb.jpg');

    return (
      <Container>
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
            <Title>{I18n.t('confirm_order.header')}</Title>
          </Body>
          <Right />
        </Header>
        <Content>
          <Foect.Form onValidSubmit={this.onConfirm}>
            {form => (
              <View
                style={{
                  padding: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => this.goToProfile(order.buyer)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Avatar
                    size="default"
                    uri={order.buyer.profilePic}
                    style={{ margin: 10 }}
                  />
                  <Text style={styles.username}>@{order.buyer.username}</Text>
                </TouchableOpacity>
                <Image
                  style={[
                    styles.itemImage,
                    {
                      width: 300,
                      height: 300,
                      // width: width / 2,
                      // height: width / 2,
                    },
                  ]}
                  source={{ uri }}
                />
                <View
                  style={{
                    marginTop: 5,
                    flexDirection: 'row',
                  }}>
                  <Button
                    block
                    dark
                    style={{
                      marginTop: 15,
                      marginHorizontal: 15,
                      width: 100,
                    }}
                    onPress={() => form.submit()}>
                    <Text style={styles.buttonText}>
                      {I18n.t('confirm_order.confirm')}
                    </Text>
                  </Button>
                  <Button
                    light
                    block
                    style={{
                      marginTop: 15,
                      width: 100,
                    }}
                    onPress={() => form.submit()}>
                    <Text style={[styles.buttonText, { color: colors.black }]}>
                      {I18n.t('alerts.action_button_cancel')}
                    </Text>
                  </Button>
                </View>
              </View>
            )}
          </Foect.Form>
        </Content>
        {/* <Footer /> */}
      </Container>
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const ConfirmOrder = connect(mapStateToProps)(ConfirmOrderContainer);

const widthFields = 280;

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontWeight: 'bold',
  },
  itemImage: {
    marginHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey4,
  },
  buttonText: {
    fontSize: 16,
    color: colors.white,
  },
});
