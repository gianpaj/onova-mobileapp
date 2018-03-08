// @flow

// eslint-disable-next-line
import { PushNotificationIOS, Platform } from 'react-native';
// $FlowFixMe
import FCM, {
  FCMEvent,
  RemoteNotificationResult,
  WillPresentNotificationResult,
  NotificationType,
} from 'react-native-fcm';
import SendBird from 'sendbird';

export function registerPushNotifications(): Promise<null> {
  return new Promise((resolve, reject) => {
    // iOS: show permission prompt for the first call. later just check permission in user settings
    // Android: check permission in user settings
    FCM.requestPermissions()
      .then(() => console.debug('notification permission granted'))
      .catch(() => console.debug('notification permission rejected'));

    // Note: Won't be called when app is killed by user in iOS
    FCM.on(FCMEvent.Notification, async notif => {
      // there are two parts of notif. notif.notification contains the notification payload, notif.data contains data payload
      if (notif.local_notification) {
        // this is a local notification
      }
      if (notif.opened_from_tray) {
        // iOS: app is open/resumed because user clicked banner
        // Android: app is open/resumed because user clicked banner or tapped app icon
      }
      // await someAsyncCall();

      console.log(notif);

      if (Platform.OS === 'ios') {
        if (notif._actionIdentifier === 'com.onova.MyCategory.Confirm') {
          // handle notification action here
          // the text from user is in notif._userText if type of the action is NotificationActionType.TextInput
        }
        // optional
        // iOS requires developers to call completionHandler to end notification process. If you do not call it your background remote notifications could be throttled, to read more about it see https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623013-application.
        // This library handles it for you automatically with default behavior (for remote notification, finish with NoData; for WillPresent, finish depend on "show_in_foreground"). However if you want to return different result, follow the following code to override
        // notif._notificationType is available for iOS platfrom
        switch (notif._notificationType) {
          case NotificationType.Remote:
            notif.finish(RemoteNotificationResult.NewData); // other types available: RemoteNotificationResult.NewData, RemoteNotificationResult.ResultFailed
            break;
          case NotificationType.NotificationResponse:
            notif.finish();
            break;
          case NotificationType.WillPresent:
            notif.finish(WillPresentNotificationResult.All); // other types available: WillPresentNotificationResult.None
            break;
        }
      }
    });

    // fcm token may not be available on first load, catch it here
    FCM.on(FCMEvent.RefreshToken, (token: string) => {
      console.log('RefreshToken');
      console.log(token);
      registerSendBirdToken(token);
    });

    FCM.getFCMToken()
      .then(token => {
        console.log('getFCMToken');
        console.log(token);
        // TODO: store fcm token in your server
        registerSendBirdToken(token);
      })
      .then(() => {
        // initial notification contains the notification that launches the app
        FCM.getInitialNotification().then(notif => {
          if (notif.fcm.action !== null) {
            console.log(notif);
          }
        });
        resolve();
      })
      .catch(e => reject(e));

    //   Notifications.configure({
    //     onNotification: notification => {
    //       console.log('NOTIFICATION:', notification);

    //       if (Platform.OS === 'ios') {
    //         notification.finish(PushNotificationIOS.FetchResult.NoData);
    //       }
    //     },

    //     // ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
    //     // senderID: '984140644677',

    //     // iOS ONLY (optional): default: all - Permissions to register.
    //     permissions: {
    //       alert: true,
    //       badge: true,
    //       sound: true,
    //     },

    //     // Should the initial notification be popped automatically
    //     popInitialNotification: true,

    //     /**
    //      * Specified if permissions (ios) and token (android and ios) will requested or not,
    //      * f not, you must call PushNotificationsHandler.requestPermissions() later.
    //      */
    //     requestPermissions: true,
    //   });
  });
}

function registerSendBirdToken(token: string) {
  const sb = SendBird.getInstance();
  if (sb) {
    if (Platform.OS === 'ios') {
      sb.registerAPNSPushTokenForCurrentUser(token, (result, err) => {
        if (err) return console.error(err);
        console.log('registerAPNSPushTokenForCurrentUser');
        console.log(result);
        // Notifications.setApplicationIconBadgeNumber(number);
      });
    } else {
      sb.registerGCMPushTokenForCurrentUser(token, (result, err) => {
        if (err) return console.error(err);
        console.log('registerGCMPushTokenForCurrentUser');
      });
    }
  }
}

export function setBadgeNumber(num: number) {
  FCM.setBadgeNumber(num);
}
