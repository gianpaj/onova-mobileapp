// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Onboarding from 'react-native-onboarding-swiper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { logout } from '../actions/actionCreator';
import type { Dispatch } from '../types';
import I18n from '../i18n';
import colors from '../config/colors';

type Props = {
  dispatch: Dispatch,
};

class IntroScreens extends Component<Props> {
  onFinish = () => this.props.dispatch(logout());

  render() {
    return (
      <Onboarding
        skipLabel="Skip"
        nextLabel="Next"
        onSkip={this.onFinish}
        onDone={this.onFinish}
        imageContainerStyles={{ marginTop: -36, paddingBottom: 36 }}
        pages={[
          {
            backgroundColor: colors.white,
            image: <Icon name="account-search" size={48} />,
            title: I18n.t('intro.step_1.title'),
            subtitle: I18n.t('intro.step_1.subtitle'),
          },
          {
            backgroundColor: colors.white,
            image: <Icon name="camera" size={48} />,
            title: I18n.t('intro.step_2.title'),
            subtitle: I18n.t('intro.step_2.subtitle'),
          },
          {
            backgroundColor: colors.white,
            image: <Icon name="help" size={48} />,
            title: I18n.t('intro.step_3.title'),
            subtitle: I18n.t('intro.step_3.subtitle'),
          },
        ]}
      />
    );
  }
}

export default connect()(IntroScreens);
