import I18n from 'react-native-i18n';
import en from './locales/en';
import uk from './locales/uk';

I18n.fallbacks = true;

const a = I18n.currentLocale();

if (a.startsWith('ru')) {
  I18n.locale = 'uk-UA';
  console.debug('Russian language detected. Fallbacking to Ukrainian');
}

I18n.translations = {
  en,
  uk,
};

export default I18n;
