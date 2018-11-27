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
  if (analyticsEnabled) {
    Sentry.addBreadcrumb({
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
  if (analyticsEnabled) {
    Sentry.addBreadcrumb({
      category: 'auth',
      ...(message ? { message: message } : {}),
      ...(data ? { data: data } : {}),
      level: 'info',
    });
  }
};

export const addErrorBreadcrumb = ({
  category,
  errMsg,
  error,
  level = 'error',
}: {
  category: string,
  errMsg?: string,
  error?: any,
  level: string,
}) => {
  if (analyticsEnabled) {
    Sentry.addBreadcrumb({
      category,
      ...(errMsg ? { message: errMsg } : {}),
      ...(error ? { data: error } : {}),
      level,
      type: 'error',
    });
  }
};
