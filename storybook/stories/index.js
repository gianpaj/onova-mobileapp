// @flow

import React from 'react';
import { Text } from 'react-native';

import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

// $FlowFixMe
import Button from './Button';
import CenterView from './CenterView';
import Welcome from './Welcome';

import colors from '../../src/config/colors';
import typography from '../../src/config/typography';

storiesOf('Welcome', module).add('to Storybook', () => (
  <Welcome showApp={linkTo('Button')} />
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
