// @flow

import I18n from 'react-native-i18n';
import { Sentry } from 'react-native-sentry';

import en from './locales/en';
import uk from './locales/uk';

I18n.fallbacks = true;

const locale = I18n.currentLocale();

if (locale.startsWith('ru')) {
  I18n.locale = 'uk-UA';
  console.debug('Russian language detected. Fallbacking to Ukrainian');
}

Sentry.captureBreadcrumb({
  category: 'user-settings',
  message: locale,
  level: 'info',
});

I18n.translations = {
  en,
  uk,
};

export default I18n;
