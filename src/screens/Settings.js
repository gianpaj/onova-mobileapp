// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Linking,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  View,
  // $FlowFixMe
} from 'react-native';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Header,
  Icon as NBIcon,
  Left,
  Right,
  Title,
  UIManager,
} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, FormLabel } from 'react-native-elements';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';
import { CardView, LiteCreditCardInput } from 'react-native-credit-card-input';

import { getUserData } from '../actions/actionCreator';
import HR from '../components/HR';
import colors from '../config/colors';
import * as api from '../utils/api';
import * as ui from '../utils/ui';
import type { UserData, Dispatch } from '../types';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp,
  userData: UserData,
  fetchLoading: boolean,
};

type State = {
  emailAddress: string,
  pending: boolean,
  password: string,
};

class SettingsContainer extends Component<Props, State> {
  state = {
    emailAddress: '',
    pending: false,
    password: '',
  };

  componentWillMount() {
    // update userData
    this.props.dispatch(getUserData(this.props.userData._id)).then(() => {
      const { userData } = this.props;
      this.setState({ emailAddress: userData.emailAddress });
    });
  }

  componentDidMount() {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    // const { userData } = this.props;
    // console.log(userData);
    // this.setState({ emailAddress: userData.emailAddress });
  }

  settingsUpdated = (): boolean => {
    const { userData } = this.props;

    return (
      this.state.password !== '' ||
      this.state.emailAddress !== userData.emailAddress
    );
  };

  onEmail() {
    Linking.openURL('mailto:hello@onova.co')
      .then(() => {
        console.log('email client opened');
      })
      .catch(err => console.error('An error occurred', err));
  }

  render() {
    const { userData, fetchLoading } = this.props;
    const { pending, password, emailAddress } = this.state;

    return (
      <Container>
        <Header>
          <Left>
            <NBButton
              transparent
              dark
              onPress={() =>
                this.props.navigation ? this.props.navigation.goBack() : null
              }>
              <NBIcon ios="ios-arrow-back" android="md-arrow-back" />
            </NBButton>
          </Left>
          <Body>
            <Title>Settings</Title>
          </Body>
          <Right>
            <NBButton
              transparent
              disabled={!this.settingsUpdated()}
              style={{ backgroundColor: 'transparent' }}
              onPress={this.updateSettings}>
              <Icon
                name="check"
                style={!this.settingsUpdated() ? { color: colors.grey3 } : null}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <Content style={{ backgroundColor: colors.white }}>
          {/* {fetchLoading ? (
            <Container style={styles.container}>
              <ActivityIndicator size="large" />
            </Container>
          ) : (
            <View> */}
          <View style={styles.padder}>
            <FormLabel labelStyle={styles.label}>
              Shipping Address:
            </FormLabel>
          <FormInput
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            editable={!pending}
            inputStyle={styles.input}
            // onChangeText={t => this.changePrice(t)}
            placeholder="Enter your shipping address here"
            // value={userData.shippingAddress}
          />
            <FormLabel labelStyle={[styles.label, { paddingBottom: 10 }]}>
              Payment Info:
            </FormLabel>
            {userData.paymentInfo ? (
              <View style={{ alignSelf: 'center' }}>
                <CardView {...this.formatCardInfo()} />
              </View>
            ) : (
              <View style={{ paddingLeft: 10 }}>
                <LiteCreditCardInput onChange={this._onCCChange} />
              </View>
            )}
            {/* <FormInput
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            editable={!pending}
            inputStyle={styles.input}
            // onChangeText={t => this.change(t)}
            placeholder="Enter your shipping address here"
            // value={userData.paymentInfoShort}
            /> */}
          </View>
          <HR full />
          <View style={styles.padder}>
          <FormLabel labelStyle={styles.label}>Email:</FormLabel>
          <FormInput
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            editable={!pending}
            inputStyle={styles.input}
            onChangeText={t => this.setState({ emailAddress: t })}
            placeholder="Change your email address. Requires validation"
            value={emailAddress}
          />
          <FormLabel labelStyle={styles.label}>Password:</FormLabel>
          <FormInput
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            editable={!pending}
            inputStyle={styles.input}
            onChangeText={t => this.setState({ password: t })}
            secureTextEntry
            placeholder="******"
            value={password}
          />
          </View>
          <HR full />
          <View style={[styles.padder, { alignItems: 'center' }]}>
            <TouchableOpacity onPress={this.onEmail}>
              <Text style={styles.centerText}>hello@onova.co</Text>
            </TouchableOpacity>
            <Text style={styles.centerText}>__version__</Text>
          </View>
          {/* </View>
        )} */}
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  label: {
    color: colors.black,
    fontWeight: '600',
  },
  input: {
    color: colors.black,
    width: '100%',
  },
  padder: {
    padding: 10,
  },
  inputContainer: {
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  centerText: {
    color: colors.grey4,
    paddingVertical: 10,
  },
});

const mapStateToProps: any = (state: any) => ({
  userData: state.LoginReducer.data,
  fetchLoading: state.LoginReducer.fetchLoading,
});

export const Settings = connect(mapStateToProps)(SettingsContainer);
