// @flow

import { Platform } from 'react-native';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen } from 'react-native-firebase';
import SendBird from 'sendbird';
// eslint-disable-next-line
import Instabug from 'instabug-reactnative';

let onMessageSubscription, onNotificationOpenedSubscription;

export function registerPushNotifications(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    firebase
      .messaging()
      .hasPermission()
      .then(enabled => {
        if (enabled) {
          Instabug.setPushNotificationsEnabled(true);
          console.debug('push permissions granted');
          // user has permissions
        } else {
          // user doesn't have permission
          return firebase
            .messaging()
            .requestPermission()
            .then(() => {
              Instabug.setPushNotificationsEnabled(true);
              console.debug('push permissions requested and granted');
            })
            .catch(err => {
              console.debug('user rejected push permissions', err);
              // TODO: handle
            });
        }
      })
      .then(() => {
        // application has been opened from a notification
        return firebase
          .notifications()
          .getInitialNotification()
          .then((notificationOpen: NotificationOpen) => {
            console.log('getInitialNotification');
            if (notificationOpen) {
              if (
                Platform.OS == 'ios' &&
                Instabug.isInstabugNotification(notificationOpen)
              ) {
                console.log('isInstabugNotification');
              } else {
              }
              // App was opened by a notification (from background)
              // Get the action triggered by the notification being opened
              const action = notificationOpen.action;
              console.log(action);
              navigate(notificationOpen);
            }
          });
      })
      .then(() => {
        if (onNotificationOpenedSubscription == null) {
          return firebase
            .notifications()
            .onNotificationOpened((notificationOpen: NotificationOpen) => {
              // TODO: Get the action triggered by the notification being opened
              // const action = notificationOpen.action;
              // console.log(action);
              // Get information about the notification that was opened
              const notification: Notification = notificationOpen.notification;
              navigate(notification);
            });
        }
      })
      .then(() => {
        return firebase.messaging().onTokenRefresh((token: string) => {
          console.log('onTokenRefresh');
          console.log(token);
          registerSendBirdToken(token);
        });
      })
      .then(() => {
        // only subscribe for messages on one place to fix "no completion handler" error is iOS
        if (onMessageSubscription == null) {
          onMessageSubscription = firebase
            .notifications()
            .onNotification((msg: Notification) => {
              console.log(msg);
              const notification = new firebase.notifications.Notification()
                .setTitle(msg.title)
                .setBody(msg.body)
                .setData(msg.data)
                .android.setChannelId('channelId');
              // You've received a notification that hasn't been displayed by the OS
              // To display it whilst the app is in the foreground, simply call the following
              firebase.notifications().displayNotification(notification);
            });
        }
      })
      .then(() => {
        firebase
          .messaging()
          .getToken()
          .then(token => {
            return registerSendBirdToken(token);
          })
          .then(token => resolve(token))
          .catch(() => reject());
      });
  });
}

function registerSendBirdToken(token: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const sb = SendBird.getInstance();
    if (sb) {
      // TODO: Promisify
      sb.unregisterGCMPushTokenAllForCurrentUser(() => {
        sb.unregisterAPNSPushTokenAllForCurrentUser(() => {
          if (Platform.OS === 'ios') {
            sb.registerAPNSPushTokenForCurrentUser(token, (result, err) => {
              if (err) {
                console.error(err);
                return reject();
              }
              console.log('registerAPNSPushTokenForCurrentUser');
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
        });
      });
    } else {
      reject();
    }
  });
}

function navigate(notif) {
  console.log(notif);
  firebase.notifications().removeDeliveredNotification(notif.notificationId);
  if (notif.data.triggeredType) {
    console.log('should navigate to:', notif.data.triggeredType);
    console.log(notif.data.triggeredBy);
  }
}

// TODO: on log out
// sb.unregisterPushTokenAllForCurrentUser();

/**
 * Sets the badge number on the app icon.
 *
 * Works in certain Android phones. We use it only for iOS.
 */
export function setBadgeNumber(num: number): Promise<void> {
  return firebase.notifications().setBadge(num);
}
