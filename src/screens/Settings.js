// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
// $FlowFixMe
import { StyleSheet, Platform, Text, View } from 'react-native';
// prettier-ignore
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Header,
  Icon,
  Left,
  Right,
  Title,
 } from 'native-base';
import { FormInput, FormLabel } from 'react-native-elements';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';

import HR from '../components/HR';
import colors from '../config/colors';
import type { UserData } from '../types';

type Props = {
  navigation?: NavigationScreenProp,
  userData: UserData,
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

  componentDidMount() {
    const { userData } = this.props;
    this.setState({ emailAddress: userData.emailAddress });
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
    const { userData } = this.props;
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
              <Icon
                name={
                  Platform.OS === 'ios' ? 'ios-arrow-back' : 'md-arrow-back'
                }
              />
            </NBButton>
          </Left>
          <Body>
            <Title>Settings</Title>
          </Body>
          <Right>{this.settingsUpdated() && <Text>Yes</Text>}</Right>
        </Header>
        <Content style={{ backgroundColor: colors.white }}>
          <View style={styles.padder}>
          <FormLabel labelStyle={styles.label}>Shipping Address:</FormLabel>
          <FormInput
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            editable={!pending}
            inputStyle={styles.input}
            // onChangeText={t => this.changePrice(t)}
            placeholder="Enter your shipping address here"
            // value={userData.shippingAddress}
          />
          <FormLabel labelStyle={styles.label}>Payment Info:</FormLabel>
          <FormInput
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            editable={!pending}
            inputStyle={styles.input}
            // onChangeText={t => this.change(t)}
            placeholder="Enter your shipping address here"
            // value={userData.paymentInfoShort}
          />
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
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
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
});

export const Settings = connect(mapStateToProps)(SettingsContainer);
