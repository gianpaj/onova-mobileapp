// @flow

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen, RemoteMessage } from 'react-native-firebase';
// import Instabug from 'instabug-reactnative';

import NavigationService from '../navigation/NavigationService';
import * as api from '../utils/api';
import type { SendbirdMessage } from '../types';
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
  const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
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
      await AsyncStorage.setItem('lastNotification', notification.notificationId);
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
        // $FlowFixMe
        navigate(notificationOpen.notification);
      });
  }

  // firebase.messaging().onTokenRefresh((token: string) => {
  //   addPushNotifBreadcrumb({ message: 'onTokenRefresh' });
  //   console.debug('onTokenRefresh');
  //   console.debug(token);
  //   // registerPushToken(token);
  // });

  // From Android 8.0 (API Level 26), notifications must specify a Notification Channel
  const channel = new firebase.notifications.Android.Channel(
    'channelId',
    'Channel Name',
    firebase.notifications.Android.Importance.Max
  ).setDescription('A natural description of the channel');
  firebase.notifications().android.createChannel(channel);

  // only subscribe for messages on one place to fix "no completion handler" error is iOS
  if (onMessageSubscription == null) {
    // $FlowFixMe
    onMessageSubscription = firebase.notifications().onNotification(handleNotification);
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

async function navigate(notif: OnovaNotification) {
  console.log(notif);
  firebase.notifications().removeDeliveredNotification(notif.notificationId);
  if (!notif.data) {
    addErrorBreadcrumb({
      category: 'push-notifications',
      error: new Error('navigate: no data key in push notification'),
    });
    return;
  }
  if (notif.data.triggeredType) {
    const { triggeredType, triggeredBy, productUuid, senderName } = notif.data;
    // TODO: show Toast error cannot navigate

    console.debug(triggeredBy);
    switch (triggeredType) {
      // follow or new drop has been listed
      case 'User':
        addPushNotifBreadcrumb({
          message: `should navigate to: ${triggeredType} ${senderName}`,
        });
        return NavigationService.navigate('profileInStack', { _id: triggeredBy }, `profile-${senderName}`);
      case 'Product':
        console.debug(productUuid);
        addPushNotifBreadcrumb({
          message: `should navigate to: ${triggeredType} ${productUuid}`,
        });
        const product = await api.getProduct(productUuid); // TODO: unnecessary API call??
        return NavigationService.navigate('product', product, `product-${product.uuid}`);
      case 'Sendbird':
        const channelUrl = notif.data.channel.channel_url;
        addPushNotifBreadcrumb({
          message: `should navigate to: ${triggeredType} ${channelUrl}`,
        });
        return NavigationService.navigate('chat', { channelUrl }, `chat-${channelUrl}`);
      case 'Order':
        const extra = JSON.parse(notif.data.extra);
        console.debug(extra);
        addPushNotifBreadcrumb({
          message: `should navigate to: ${triggeredType} ${triggeredBy}`,
        });
        // order needs confirmation
        if (extra.status == 'paid')
          return NavigationService.navigate('confirmOrder', { id: triggeredBy }, 'confirmOrder');
        break;
      case 'Drop':
        addPushNotifBreadcrumb({
          message: `should navigate to: ${triggeredType} ${triggeredBy}`,
        });
        return NavigationService.navigate(
          'profileInStack',
          { _id: triggeredBy, tab: 'drops' },
          `profile-${senderName}`
        );
      default:
        break;
    }
  }

  if (notif.isSendbirdNotification) {
    console.log('send bird push navigation');
    console.log(notif.data);
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

type OnovaNotification = Notification & {
  data: {
    [string]: string,
    sendbird?: string,
    triggeredType?: string,
    channel?: {
      channel_url: string,
    },
  },
  sentTime?: number,
  from?: string,
  messageId?: string,
};

async function handleNotification(msg: OnovaNotification) {
  const { data } = msg;
  console.log('push-notification');
  console.log(msg);

  let notification;
  let payload: SendbirdMessage;
  if (data.sendbird) {
    payload = JSON.parse(data.sendbird);
    console.log('data.sendbird');
    console.log(payload);
    notification = new firebase.notifications.Notification({ show_in_foreground: true })
      .setNotificationId(msg.messageId)
      .setTitle(payload.sender.name)
      // .setTitle(payload.push_alert)
      // .setSubtitle(`Number of unread messages: ${payload.unread_message_count}`)
      .setBody(payload.message)
      .setData({ ...payload, triggeredType: 'Sendbird' });
    addPushNotifBreadcrumb({ message: payload.push_alert, data: { sentTime: msg.sentTime, ...payload } });
  } else {
    notification = new firebase.notifications.Notification()
      .setTitle(msg.title)
      .setBody(msg.body)
      .setData(msg.data);
    addPushNotifBreadcrumb({ data: { title: msg.title, body: msg.body, data } });
  }

  if (Platform.OS === 'android') {
    notification.android.setPriority(parseInt(msg.data.priority) || firebase.notifications.Android.Priority.High);
    notification.android.setSmallIcon('ic_stat_ic_notification');
    notification.android.setChannelId('channelId');
    if (payload && payload.sender.profile_url) {
      notification.android.setLargeIcon(payload.sender.profile_url);
    }
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
}

export async function bgMessaging(message: RemoteMessage) {
  console.log('bgMessaging');
  return handleNotification(message);
}
