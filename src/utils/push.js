// @flow

import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen } from 'react-native-firebase';
// import Instabug from 'instabug-reactnative';

import NavigationService from '../navigation/NavigationService';
import * as api from '../utils/api';

let onMessageSubscription, onNotificationOpenedSubscription;

export function registerPushNotifications(): Promise<string | null> {
  console.debug('registerPushNotifications');
  return new Promise((resolve, reject) => {
    firebase
      .messaging()
      .hasPermission()
      .then(enabled => {
        if (enabled) {
          // Instabug.setPushNotificationsEnabled(true);
          console.debug('push permissions granted');
          // user has permissions
          return;
        }
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
      })
      // application has been opened from a notification
      .then(() =>
        firebase
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
              navigate(notificationOpen.notification);
            }
          })
      )
      .then(() => {
        // if (onNotificationOpenedSubscription === undefined) {
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
        // }
      })
      .then(() =>
        firebase.messaging().onTokenRefresh((token: string) => {
          console.log('onTokenRefresh');
          console.log(token);
          // registerPushToken(token);
        })
      )
      .then(() => {
        // From Android 8.0 (API Level 26), notifications must specify a Notification Channel
        const channel = new firebase.notifications.Android.Channel(
          'channelId',
          'Channel Name',
          firebase.notifications.Android.Importance.Max
        ).setDescription('A natural description of the channel');
        firebase.notifications().android.createChannel(channel);

        // only subscribe for messages on one place to fix "no completion handler" error is iOS
        if (onMessageSubscription == null) {
          onMessageSubscription = firebase
            .notifications()
            .onNotification(async (msg: Notification) => {
              console.log(msg);
              const notification = new firebase.notifications.Notification()
                .setTitle(msg.title)
                .setBody(msg.body)
                .setData(msg.data)
                .android.setPriority(
                  parseInt(msg.data.priority) ||
                    firebase.notifications.Android.Priority.High
                )
                .android.setSmallIcon('ic_stat_ic_notification')
                .android.setChannelId('channelId');
              // You've received a notification that hasn't been displayed by the OS
              // To display it whilst the app is in the foreground, simply call the following
              try {
                await firebase
                  .notifications()
                  .displayNotification(notification);
              } catch (error) {
                console.error(error);
              }
            });
        }
      })
      .then(() =>
        firebase
          .messaging()
          .getToken()
          // .then(token => {
          //   return registerPushToken(token);
          // })
          .then(token => resolve(token))
          .catch(() => reject())
      );
  });
}

// FIXME: send pushToken here instead from actionCreator
// function registerPushToken(token: string): Promise<string | null> {
//   return new Promise((resolve, reject) => {
//     // if (err) {
//     //   console.error(err);
//     //   return reject();
//     // }
//     // Notifications.setApplicationIconBadgeNumber(number);
//     resolve(token);
//   });
// }

async function navigate(notif) {
  console.log(notif);
  firebase.notifications().removeDeliveredNotification(notif.notificationId);
  if (notif.data && notif.data.triggeredType) {
    const { triggeredType, triggeredBy, productUuid } = notif.data;
    const extra = JSON.parse(notif.data.extra);
    console.debug('should navigate to:', triggeredType);

    // TODO: show Toast error cannot navigate

    // follow
    if (triggeredType == 'User') {
      console.debug(triggeredBy);
      const user = await api.getUser(triggeredBy);
      return NavigationService.navigate(
        'profileInStack',
        user,
        `profile-${user.username}`
      );
    }
    if (triggeredType == 'Product') {
      console.debug(productUuid);
      const product = await api.getProduct(productUuid);
      return NavigationService.navigate(
        'product',
        product,
        `product-${product.uuid}`
      );
    }
    if (triggeredType == 'Room') {
      console.debug(triggeredBy);
      return NavigationService.navigate(
        'chat',
        { roomId: parseInt(triggeredBy) },
        `chat-${triggeredBy}`
      );
    }
    if (triggeredType === 'Order') {
      console.debug(triggeredBy);
      console.debug(extra);
      // order needs confirmation
      if (extra.status == 'paid')
        return NavigationService.navigate(
          'confirmOrder',
          { id: triggeredBy },
          'confirmOrder'
        );
    }
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
