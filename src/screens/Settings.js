// @flow

import React, { Component } from 'react';
// $FlowFixMe
import { StyleSheet, Text, Platform, View } from 'react-native';
// prettier-ignore
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Header,
  ListItem,
  Icon,
  Left,
  Right,
  Title,
 } from 'native-base';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';

type Props = {
  navigation?: NavigationScreenProp,
  userData: any,
};

class SettingsContainer extends Component<Props> {
  render() {
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
          <Right />
        </Header>
        <Content>
          <ListItem>
            <Body>
              <Text>
                This is Content Section
              </Text>
            </Body>
          </ListItem>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({});

export const Settings = SettingsContainer;
