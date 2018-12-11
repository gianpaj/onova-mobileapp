// @flow

import React from 'react';
import { Text } from 'react-native';

import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
// import { linkTo } from '@storybook/addon-links';

// $FlowFixMe
import Button from './Button';
import CenterView from './CenterView';
import Welcome from './Welcome';
import ReviewCard from './ReviewCard';
import ImagePicker from './ImagePicker';

import colors from '../../src/config/colors';
import typography from '../../src/config/typography';

storiesOf('Welcome', module).add('to Storybook', () => (
  <Welcome
  // showApp={linkTo('Button')}
  />
));

storiesOf('Button', module)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('with text', () => (
    <Button
      onPress={action('clicked-text')}
      dark
      style={{
        alignSelf: 'center',
        justifyContent: 'center',
        width: 100,
      }}>
      <Text
        style={{
          fontSize: typography.font_button_size,
          color: colors.white,
        }}>
        Search
      </Text>
    </Button>
  ))
  .add('with text in Ukranian', () => (
    <Button
      dark
      style={{
        alignSelf: 'center',
        justifyContent: 'center',
        width: 100,
      }}
      onPress={action('clicked-text')}>
      <Text
        style={{
          fontSize: typography.font_button_size,
          color: colors.white,
        }}>
        Знайти
      </Text>
    </Button>
  ))
  .add('with block', () => (
    <Button block onPress={action('clicked-text')}>
      <Text>Hello Buttons</Text>
    </Button>
  ));

const REVIEW = {
  _id: '5b250287fdf7ca7634b8f6a7',
  fromUser: '5b208a03508ef817b284d995',
  targetUser: '5afaa93daeeb1453812fc011',
  order: {
    currency: 'UAH',
    buyer: {
      _id: '5afaa93daeeb1453812fc011',
      username: 'alex',
    },
    onovaFee: '350',
    citySender: 'Львів',
    cityRecipient: 'Чернівці',
    priceOfItem: '350',
    product: {
      currency: 'UAH',
      photoURIs: [
        'http://assets.onova.co/products/HJdFQOG-Q-1-1529148288157.jpg',
        'http://assets.onova.co/products/HJdFQOG-Q-2-1529148288157.jpg',
        'http://assets.onova.co/products/HJdFQOG-Q-3-1529148288157.jpg',
      ],
      _id: '5b24f380fdf7ca7634b8f6a1',
      price: '350',
      uuid: 'ByGheYGZ7',
      comments: [],
      seller: '5b208a03508ef817b284d995',
    },
    seller: {
      _id: '5b208a03508ef817b284d995',
      username: 'alex_lisov',
    },
    datePending: '2018-06-16T12:18:55.239Z',
    reviewFromBuyer: '5b2500aafdf7ca7634b8f6a6',
    trackingNumber: '20450076656159',
    reviewFromSeller: '5b250287fdf7ca7634b8f6a7',
    id: '5b25002ffdf7ca7634b8f6a5',
  },
  rateNumber: 5,
  lang: 'en',
  createdAt: '2018-06-16T12:28:55.296Z',
  id: '5b250287fdf7ca7634b8f6a7',
};

storiesOf('ReviewCard', module)
  // .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('with a long review text', () => (
    <ReviewCard
      onPress={action('clicked-reviewee')}
      review={{
        ...REVIEW,
        text:
          'Ответственный покупатель! Сделка прошло отлично! Только положительные эмоции',
      }}
    />
  ))
  .add('with a short review text', () => (
    <ReviewCard
      onPress={action('clicked-reviewee')}
      review={{ ...REVIEW, text: 'Ответственный покупатель!' }}
    />
  ))
  .add('with NO review text', () => (
    <ReviewCard onPress={action('clicked-reviewee')} review={{ ...REVIEW }} />
  ));

storiesOf('ImagePicker', module)
  .add('with no images', () => (
    <ImagePicker imagePerRow={6} enabled onChangeOrder={() => {}} />
  ))
  .add('with images from iPhone Simulator', () => (
    <ImagePicker
      files={[
        {
          url:
            '/Users/gianfranco/Library/Developer/CoreSimulator/Devices/F1546411-8B1F-4DBE-A078-FD2993EEC45F/data/Containers/Data/Application/8C0EF2CA-EDC6-46D7-8DC8-22ED2D7294E8/tmp/react-native-image-crop-picker/15E541FD-64F6-4AE7-AAA3-359AD833D4BC.jpg',
          id: 0,
        },
        {
          url:
            '/Users/gianfranco/Library/Developer/CoreSimulator/Devices/F1546411-8B1F-4DBE-A078-FD2993EEC45F/data/Containers/Data/Application/8C0EF2CA-EDC6-46D7-8DC8-22ED2D7294E8/tmp/react-native-image-crop-picker/2A8907D1-B705-46C7-BF68-86231E7B226C.jpg',
          id: 1,
        },
      ]}
      imagePerRow={6}
      enabled
      onChangeOrder={() => {}}
    />
  ))
  .add('uploading images', () => (
    <ImagePicker
      files={[
        {
          isUploading: true,
        },
        {
          isUploading: true,
        },
      ]}
      imagePerRow={6}
      enabled={false}
      onChangeOrder={() => {}}
    />
  ));
