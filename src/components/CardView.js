// @flow

// originally from https://github.com/sbycrosz/react-native-credit-card-input/blob/a2b9253bd48eb1e71b620e58073047b47748233a/src/CardView.js

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image, ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import colors from '../config/colors';

// import defaultIcons from "./Icons";

const BASE_SIZE = { width: 300, height: 190 };

const s = StyleSheet.create({
  baseText: {
    backgroundColor: colors.transparent,
    color: colors.grey4,
  },
  cardContainer: {},
  cardFace: {},
  expiry: {
    bottom: 20,
    fontSize: 16,
    left: 220,
    position: 'absolute',
  },
  focused: {
    color: colors.white,
    fontWeight: 'bold',
  },
  icon: {
    height: 40,
    position: 'absolute',
    resizeMode: 'contain',
    right: 15,
    top: 15,
    width: 60,
  },
  number: {
    fontSize: 21,
    left: 28,
    position: 'absolute',
    top: 95,
  },
  placeholder: {
    color: colors.grey3,
  },
});

const Icons = {
  mastercard: require('../assets/images/stp_card_mastercard.png'),
  visa: require('../assets/images/stp_card_visa.png'),
};

export default class CardView extends Component {
  static propTypes = {
    focused: PropTypes.string,

    number: PropTypes.string,
    placeholder: PropTypes.object,

    scale: PropTypes.number,
    fontFamily: PropTypes.string,
    imageFront: PropTypes.number,
  };

  static defaultProps = {
    placeholder: {
      number: '•••• •••• •••• ••••',
      expiry: '••/••',
    },

    scale: 1,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    imageFront: require('../assets/images/card-front.jpg'),
  };

  render() {
    const { focused, fontFamily, imageFront, number, placeholder, scale } = this.props;

    const brand = /^4/.test(number) ? 'visa' : /^5[1-5]/.test(number) ? 'mastercard' : false;

    const containerSize = {
      ...BASE_SIZE,
      width: BASE_SIZE.width * scale,
      height: BASE_SIZE.height * scale,
    };
    const transform = {
      transform: [
        { translateX: (BASE_SIZE.width * (scale - 1)) / 2 },
        { translateY: (BASE_SIZE.height * (scale - 1)) / 2 },
        { scale },
      ],
    };

    return (
      <View style={[s.cardContainer, containerSize]}>
        <ImageBackground style={[BASE_SIZE, s.cardFace, transform]} source={imageFront}>
          {brand && <Image style={s.icon} source={Icons[brand]} />}
          <Text
            style={[s.baseText, { fontFamily }, s.number, !number && s.placeholder, focused === 'number' && s.focused]}>
            {!number ? placeholder.number : number}
          </Text>
          <Text style={[s.baseText, { fontFamily }, s.expiry, s.placeholder]}>{placeholder.expiry}</Text>
        </ImageBackground>
      </View>
    );
  }
}
