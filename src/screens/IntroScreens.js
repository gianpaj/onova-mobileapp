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
          <MaterialIcons
            name="check"
            size={36}
            style={{ left: -10 }}
            onPress={this.onFinish}
          />
        )}
        pages={[
          {
            backgroundColor: colors.white,
            image: <Icon color={colors.black} name="md-person-add" size={48} />,
            title: I18n.t('intro.step_1.title'),
            subtitle: I18n.t('intro.step_1.subtitle'),
          },
          {
            backgroundColor: colors.white,
            image: <Icon color={colors.black} name="md-camera" size={48} />,
            title: I18n.t('intro.step_2.title'),
            subtitle: I18n.t('intro.step_2.subtitle'),
          },
          {
            backgroundColor: colors.white,
            image: (
              <Icon
                color={colors.black}
                name="md-information-circle"
                size={48}
              />
            ),
            title: I18n.t('intro.step_3.title'),
            subtitle: I18n.t('intro.step_3.subtitle'),
          },
        ]}
      />
    );
  }
}

export default connect()(IntroScreens);
