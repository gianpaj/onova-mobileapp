// @flow

// eslint-disable-next-line
import { PushNotificationIOS, Platform } from 'react-native';
// $FlowFixMe
import Notifications from 'react-native-push-notification';
import SendBird from 'sendbird';

export function registerPushNotifications() {
  const sb = SendBird.getInstance();
  // if (sb) {
  //   if (Platform.OS === 'ios') {
  //     if (sb.getPendingAPNSToken()) {
  //       sb.registerAPNSPushTokenForCurrentUser(
  //         sb.getPendingAPNSToken(),
  //         (result, err) => {
  //           if (err) return console.error(err);
  //           console.log('APNS TOKEN REGISTER AFTER LOGIN');
  //           console.log(result);
  //         }
  //       );
  //     }
  //   } else {
  //     if (sb.getPendingGCMToken()) {
  //       sb.registerGCMPushTokenForCurrentUser(
  //         sb.getPendingGCMToken(),
  //         (result, err) => {
  //           if (err) return console.error(err);
  //           console.log('GCM TOKEN REGISTER AFTER LOGIN');
  //           console.log(result);
  //         }
  //       );
  //     }
  //   }
  // }
  console.log(sb.getPendingGCMToken());
  Notifications.configure({
    onRegister: (token: any) => {
      console.warn(sb);
      if (sb) {
        if (Platform.OS === 'ios') {
          sb.registerAPNSPushTokenForCurrentUser(
            token['token'],
            (result, err) => {
              if (err) return console.error(err);
              console.log('registerAPNSPushTokenForCurrentUser');
              console.log(result);
              // Notifications.setApplicationIconBadgeNumber(number);
            }
          );
        } else {
          sb.registerGCMPushTokenForCurrentUser(
            token['token'],
            (result, err) => {
              if (err) return console.error(err);
              console.log('registerAPNSPushTokenForCurrentUser');
              console.log(result);
            }
          );
        }
      }
    },

    onNotification: notification => {
      console.log('NOTIFICATION:', notification);

      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },

    // ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
    // senderID: '984140644677',

    // iOS ONLY (optional): default: all - Permissions to register.
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // Should the initial notification be popped automatically
    popInitialNotification: true,

    /**
     * Specified if permissions (ios) and token (android and ios) will requested or not,
     * f not, you must call PushNotificationsHandler.requestPermissions() later.
     */
    requestPermissions: true,
  });
}
