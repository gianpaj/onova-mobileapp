// @flow

import { AsyncStorage, Platform } from 'react-native';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen } from 'react-native-firebase';
// import Instabug from 'instabug-reactnative';

import NavigationService from '../navigation/NavigationService';
import * as api from '../utils/api';
import { addPushNotifBreadcrumb, addErrorBreadcrumb } from '../utils/analytics';

let onMessageSubscription, onNotificationOpenedSubscription;

export async function registerPushNotifications(): Promise<string> {
  console.debug('registerPushNotifications');
  try {
    const enabled = await firebase.messaging().hasPermission();
    // user doesn't have permission
    if (!enabled) {
      try {
        await firebase.messaging().requestPermission();
        // Instabug.setPushNotificationsEnabled(true);
        addPushNotifBreadcrumb({
          message: 'push permissions requested and granted',
        });
      } catch (error) {
        addErrorBreadcrumb({
          category: 'push-notifications',
          error,
          level: 'warning',
        });
        // hack iOS01: to allow the login to continue even though the user denied permission - should throw an error
        return error;
        // TODO: handle
      }
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
  const notificationOpen: NotificationOpen = await firebase
    .notifications()
    .getInitialNotification();
  if (notificationOpen) {
    console.debug('notificationOpen');
    // App was opened by a notification
    // if (
    //   Platform.OS == 'ios' &&
    //   Instabug.isInstabugNotification(notificationOpen)
    // ) {
    //   console.log('isInstabugNotification');
    // } else {
    // }
    // Get the action triggered by the notification being opened
    // const action = notificationOpen.action;
    // console.log(action);
    // Get information about the notification that was opened
    const { notification } = notificationOpen;

    const lastNotification = await AsyncStorage.getItem('lastNotification');
    if (lastNotification !== notification.notificationId) {
      navigate(notification);
      await AsyncStorage.setItem(
        'lastNotification',
        notification.notificationId
      );
    }
  }
  // App in Foreground and background
  if (onNotificationOpenedSubscription === undefined) {
    onNotificationOpenedSubscription = firebase
      .notifications()
      .onNotificationOpened((notificationOpen: NotificationOpen) => {
        //  Get the action triggered by the notification being opened
        // const action = notificationOpen.action;
        // console.log(action);
        // Get information about the notification that was opened
        const notification: Notification = notificationOpen.notification;
        navigate(notification);
      });
  }

  firebase.messaging().onTokenRefresh((token: string) => {
    addPushNotifBreadcrumb({ message: 'onTokenRefresh' });
    console.debug('onTokenRefresh');
    console.debug(token);
    // registerPushToken(token);
  });

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
        const { title, body, data } = msg;
        addPushNotifBreadcrumb({ data: { title, body, data } });
        const notification = new firebase.notifications.Notification()
          .setNotificationId(msg.notificationId)
          .setTitle(msg.title)
          .setBody(msg.body)
          .setData(msg.data);

        if (Platform.OS === 'android') {
          notification.android.setPriority(
            parseInt(msg.data.priority) ||
              firebase.notifications.Android.Priority.High
          );
          notification.android
            .setSmallIcon('ic_stat_ic_notification')
            .android.setChannelId('channelId');
        }
        // You've received a notification that hasn't been displayed by the OS
        // To display it whilst the app is in the foreground, simply call the following
        try {
          await firebase.notifications().displayNotification(notification);
        } catch (error) {
          addErrorBreadcrumb({
            category: 'push-notifications',
            error,
          });
        }
      });
  }
  try {
    const token = await firebase.messaging().getToken();
    console.debug(token);
    return token;
  } catch (error) {
    console.debug(error);
    addErrorBreadcrumb({
      category: 'push-notifications',
      error,
    });
    throw error;
  }
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
    const { triggeredType, triggeredBy, productUuid, senderName } = notif.data;
    addPushNotifBreadcrumb({ message: 'should navigate to: ' + triggeredType });

    // TODO: show Toast error cannot navigate

    // follow or new drop has been listed
    if (triggeredType == 'User') {
      console.debug(triggeredBy);
      return NavigationService.navigate(
        'profileInStack',
        { _id: triggeredBy },
        `profile-${senderName}`
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
        `chat-${triggeredBy}` // TODO: use OrderId
      );
    }
    const extra = JSON.parse(notif.data.extra);
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
    if (triggeredType === 'DropSubscription') {
      console.debug(triggeredBy);
      return NavigationService.navigate(
        'profileInStack',
        { _id: triggeredBy, tab: 'drops' },
        `profile-${senderName}`
      );
    }
  }
}
// TODO: on log out
// sb.unregisterPushTokenAllForCurrentUser();

/**
 * Sets the badge number on the app icon.
 * TODO: put on use
 *
 * Works in certain Android phones. We use it only for iOS.
 */
export function setBadgeNumber(num: number): Promise<void> {
  return firebase.notifications().setBadge(num);
}
