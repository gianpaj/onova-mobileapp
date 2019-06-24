// @flow

// inspired by from https://github.com/talalmajali/react-native-countdown-component/blob/master/index.js

import React from 'react';
import PropTypes from 'prop-types';

import { AppState, StyleSheet, Text, View } from 'react-native';
import _ from 'lodash';
import { sprintf } from 'sprintf-js';

import colors from '../config/colors';
import I18n from '../i18n';

const DEFAULT_BG_COLOR = colors.white;
const DEFAULT_DIGIT_TXT_COLOR = colors.red;

export default class Countdown extends React.Component<*, *> {
  timer: ?IntervalID;
  onFinish: Function;
  static propTypes = {
    digitBgColor: PropTypes.string,
    digitTxtColor: PropTypes.string,
    size: PropTypes.number,
    until: PropTypes.number,
    onFinish: PropTypes.func,
  };

  state = {
    until: Math.max(this.props.until, 0),
    wentBackgroundAt: null,
  };

  static defaultProps = {
    digitBgColor: DEFAULT_BG_COLOR,
    digitTxtColor: DEFAULT_DIGIT_TXT_COLOR,
    until: 0,
    size: 15,
  };

  componentDidMount() {
    if (this.props.onFinish) {
      this.onFinish = _.once(this.props.onFinish);
    }
    this.timer = setInterval(this.updateTimer, 1000);
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = currentAppState => {
    const { until, wentBackgroundAt } = this.state;
    if (currentAppState === 'active' && wentBackgroundAt) {
      const diff = (Date.now() - wentBackgroundAt) / 1000.0;
      this.setState({ until: Math.max(0, until - diff) });
    }
    if (currentAppState === 'background') {
      this.setState({ wentBackgroundAt: Date.now() });
    }
  };

  getTimeLeft = () => {
    const { until } = this.state;
    return {
      seconds: until % 60,
      minutes: parseInt(until / 60, 10) % 60,
    };
  };

  updateTimer = () => {
    const { until } = this.state;

    if (until <= 1) {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.setState({ until: 0 });
      if (this.onFinish) {
        this.onFinish();
      }
    } else {
      this.setState({ until: until - 1 });
    }
  };

  renderDigits = (digits: string, style: any = {}) => {
    const { digitBgColor, digitTxtColor, size } = this.props;
    return (
      <View style={styles.doubleDigitCont}>
        <View
          style={[
            styles.digitCont,
            { backgroundColor: digitBgColor },
            {
              height: size * 2.6,
            },
          ]}>
          <Text numberOfLines={1} style={[styles.digitTxt, { fontSize: size }, { color: digitTxtColor }, style]}>
            {digits}
          </Text>
        </View>
      </View>
    );
  };

  renderCountDown = () => {
    const { minutes, seconds } = this.getTimeLeft();
    const [min, sec] = sprintf('%01d:%01d', minutes, seconds).split(':');

    return (
      <View style={styles.timeCont}>
        {this.renderDigits(
          `${min}${I18n.t('countdown.m')} ${sec}${I18n.t('countdown.s')} `,
          I18n.locale === 'uk-UA' ? 2.3 : 2.2
        )}
      </View>
    );
  };

  render() {
    return <View style={this.props.style}>{this.renderCountDown()}</View>;
  }
}

const styles = StyleSheet.create({
  digitCont: {
    alignItems: 'center',
    borderRadius: 5,
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  digitTxt: {
    color: colors.red,
    fontVariant: ['tabular-nums'],
  },
  doubleDigitCont: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCont: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
