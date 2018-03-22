// @flow

// eslint-disable-next-line
import { PushNotificationIOS, Platform } from 'react-native';
import firebase from 'react-native-firebase';
import SendBird from 'sendbird';

export function registerPushNotifications(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'ios') {
      firebase
        .messaging()
        .requestPermissions()
        .then(status => {
          console.log(status);
          console.log(status.granted);
        });
    }

    // application has been opened from a notification
    firebase
      .messaging()
      .getInitialNotification()
      .then(notif => {
        console.log('getInitialNotification');
        console.log(notif);
      });

    firebase
      .messaging()
      .getToken()
      .then(token => {
        // TODO: send fcm token in your server
        return registerSendBirdToken(token);
      })
      .then(token => resolve(token))
      .catch(() => reject());

    firebase.messaging().onTokenRefresh(token => {
      console.log('onTokenRefresh');
      console.log(token);
      registerSendBirdToken(token);
    });

    firebase.messaging().onMessage(message => {
      // prevent infite look
      if (!message.local_notification) {
        console.log('Got onMessage');
        console.log(message);
        firebase.messaging().createLocalNotification({
          title: message.title,
          body: message.body,
          local_notification: true,
          priority: 'high', // show the notification expanded whtn
          show_in_foreground: true,
        });
      }
    });
  });
}

function registerSendBirdToken(token: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const sb = SendBird.getInstance();
    if (sb) {
      if (Platform.OS === 'ios') {
        sb.registerAPNSPushTokenForCurrentUser(token, (result, err) => {
          if (err) {
            console.error(err);
            return reject();
          }
          console.log('registerAPNSPushTokenForCurrentUser');
          console.log(result);
          // Notifications.setApplicationIconBadgeNumber(number);
          resolve(token);
        });
      } else {
        sb.registerGCMPushTokenForCurrentUser(token, (result, err) => {
          if (err) {
            console.error(err);
            return reject();
          }
          console.log('registerGCMPushTokenForCurrentUser');
          resolve(token);
        });
      }
    } else {
      reject();
    }
  });
}

/**
 * Sets the badge number on the app icon.
 *
 * Works in certain Android phones. We use it only for iOS.
 *
 * @param {*} num
 */
export function setBadgeNumber(num: number): void {
  firebase.messaging().setBadgeNumber(num);
}
