// @flow

// import { Platform } from 'react-native';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen } from 'react-native-firebase';
// import SendBird from 'sendbird';
// eslint-disable-next-line
// import Instabug from 'instabug-reactnative';

import NavigationService from '../navigation/NavigationService';
import * as api from '../utils/api';
import type { UserData } from '../types';

let onMessageSubscription, onNotificationOpenedSubscription;

export function registerPushNotifications(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    firebase
      .messaging()
      .hasPermission()
      .then(enabled => {
        if (enabled) {
          // Instabug.setPushNotificationsEnabled(true);
          console.debug('push permissions granted');
          // user has permissions
        } else {
          // user doesn't have permission
          return firebase
            .messaging()
            .requestPermission()
            .then(() => {
              // Instabug.setPushNotificationsEnabled(true);
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
              // if (
              //   Platform.OS == 'ios' &&
              //   Instabug.isInstabugNotification(notificationOpen)
              // ) {
              //   console.log('isInstabugNotification');
              // } else {
              // }
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
          registerPushToken(token);
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
            return registerPushToken(token);
          })
          .then(token => resolve(token))
          .catch(() => reject());
      });
  });
}

function registerPushToken(token: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    // if (err) {
    //   console.error(err);
    //   return reject();
    // }
    // Notifications.setApplicationIconBadgeNumber(number);
    resolve(token);
  });
}

async function navigate(notif) {
  console.log(notif);
  firebase.notifications().removeDeliveredNotification(notif.notificationId);
  if (notif.data && notif.data.triggeredType) {
    const { triggeredType, triggeredBy } = notif.data;
    console.warn('should navigate to:', triggeredType);
    console.warn(triggeredBy);

    // follow
    if (triggeredType == 'User') {
      console.warn('navigate to User:', triggeredBy);
      // const user = await getUser(triggeredBy);
      return NavigationService.navigate(
        'profile',
        {
          // params: user,
          params: {
            accountStatus: 'verified',
            emailAddress: 'gianpa+test4@gmail.com',
            followersCount: 1,
            followingCount: 1,
            ratingsTotal: 0,
            reviewsCount: 0,
            username: 'gianpatestlocal',
            _id: '5adb67d6f57c81ac147d5e80',
          },
          // key: `profile-${user.username}`,
        },
        `profile-gianpatestlocal`
      );
    }
  }
}

function getUser(userId): Promise<UserData> {
  return api
    .get(`/api/users/${userId}`)
    .then((res: UserData) => {
      console.debug(res);
      return res;
    })
    .catch(err => {
      return err;
    });
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
