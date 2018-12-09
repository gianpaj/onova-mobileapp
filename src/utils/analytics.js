// @flow

import { Sentry } from 'react-native-sentry';

import { analyticsEnabled } from './api';

export const addNavigationBreadcrumb = ({
  message,
  data,
}: {
  message?: string,
  data?: any,
}) => {
  log(message || data);
  if (analyticsEnabled) {
    Sentry.captureBreadcrumb({
      category: 'navigation',
      ...(message ? { message: message } : {}),
      ...(data ? { data: data } : {}),
      level: 'info',
    });
  }
};

export const addAuthBreadcrumb = ({
  message,
  data,
}: {
  message?: string,
  data?: any,
}) => {
  log(message || data);
  if (analyticsEnabled) {
    Sentry.captureBreadcrumb({
      category: 'auth',
      ...(message ? { message: message } : {}),
      ...(data ? { data: data } : {}),
      level: 'info',
    });
  }
};

export const addPushNotifBreadcrumb = ({
  message,
  data,
}: {
  message?: string,
  data?: any,
}) => {
  log(message || data);
  if (analyticsEnabled) {
    Sentry.captureBreadcrumb({
      category: 'push-notifications',
      ...(message ? { message: message } : {}),
      ...(data ? { data: data } : {}),
      level: 'info',
    });
  }
};

/**
 * Wrapper to add add error Breadcrumb to Sentry.
 * Respects `analyticsEnabled`
 *
 * @param {Object} options - options
 * @param {string} options.level= ['fatal', 'error', 'warning', 'info', 'debug', '']
 */
export const addErrorBreadcrumb = ({
  category,
  errMsg,
  error,
  level = 'error',
}: {
  category: string,
  errMsg?: string,
  error?: any,
  level?: string,
}) => {
  log(errMsg || error, level);
  if (analyticsEnabled) {
    Sentry.captureBreadcrumb({
      category,
      ...(errMsg ? { message: errMsg } : {}),
      ...(error ? { data: error } : {}),
      level,
      type: 'error',
    });
  }
};

function log(msg, level = 'debug') {
  if (typeof msg !== 'string') msg = JSON.stringify(msg);

  switch (level) {
    case 'fatal':
    case 'error':
      console.error(msg);
      break;
    case 'warning':
      console.warn(msg);
      break;

    default:
      console.debug(msg);
      break;
  }
}
