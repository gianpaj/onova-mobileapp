// @flow

// $FlowFixMe
import { Alert, AlertIOS } from 'react-native';
import { Toast } from 'native-base';

/**
 * Show a Toast/Alert message from Native Base
 *
 * @param message
 * @param type ['warning', 'success', 'danger', '']
 */
export function showToast(message: string, type: string = '') {
  Toast.show({
    text: message,
    type: type,
    duration: 2000,
    position: 'top',
    textStyle: { textAlign: 'center' },
  });
}

/**
 * Show React Native Alert
 *
 * @param title
 * @param message
 * @param onContinue
 * @param onDismiss
 */
export function showConfirmAlert(
  title: string,
  message: string,
  onContinue: () => void,
  onDismiss?: () => void = () => {}
) {
  return Alert.alert(title, message, [
    { text: 'No', onPress: onDismiss, style: 'cancel' },
    { text: 'Yes', onPress: onContinue },
  ]);
}
