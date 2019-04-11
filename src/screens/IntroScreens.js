// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Onboarding from 'react-native-onboarding-swiper';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { logout } from '../actions/actionCreator';
import type { Dispatch } from '../types';
import I18n from '../i18n';
import colors from '../config/colors';
import Shield from '../assets/svg/shield';
import ShoeLabel from '../assets/svg/shoe-label';

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
        imageContainerStyles={{ marginTop: -36, paddingBottom: 36 }}
        bottomBarHighlight={false}
        DoneButtonComponent={() => (
          <MaterialIcons color={colors.black} name="check" size={36} style={{ left: -10 }} onPress={this.onFinish} />
        )}
        pages={[
          {
            backgroundColor: colors.white,
            image: <Shield width={80} height={80} />,
            title: I18n.t('intro.step_1.title'),
            subtitle: I18n.t('intro.step_1.subtitle'),
          },
          {
            backgroundColor: colors.white,
            image: <ShoeLabel width={80} height={80} />,
            title: I18n.t('intro.step_2.title'),
            subtitle: I18n.t('intro.step_2.subtitle'),
          },
          {
            backgroundColor: colors.white,
            image: <Icon color={colors.black} name="md-person-add" size={80} />,
            title: I18n.t('intro.step_3.title'),
            subtitle: I18n.t('intro.step_3.subtitle'),
          },
        ]}
      />
    );
  }
}

export default connect()(IntroScreens);
