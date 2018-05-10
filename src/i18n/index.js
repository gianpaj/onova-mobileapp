import I18n from 'react-native-i18n';
import en from './locales/en';
import uk from './locales/uk';

I18n.fallbacks = true;

I18n.translations = {
  en,
  uk,
};

export default I18n;
