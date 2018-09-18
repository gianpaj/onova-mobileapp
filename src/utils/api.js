// @flow

import axios from 'axios';
import type { CancelToken } from 'axios';

import I18n from '../i18n';

import type { Order, Product, UserData } from '../types';

let config;
let isProd = false;
if (process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production') {
  isProd = true;
  config = require('../../config-prod.json');
} else {
  config = require('../../config-dev.json');
}

export { isProd, config };

if (!global.__TESTING__) console.debug(`connecting to ${config.API_URL}`);

axios.defaults.baseURL = config.API_URL;
const TIMEOUT = 10000;

export type Options = {
  suppressRedBox?: boolean, // If true, no warning is shown on failed request
  cancelToken?: CancelToken,
  timeout?: number,
  token?: string,
  data?: mixed,
  onUploadProgress?: Event => void | mixed,
};

/**
 * GET a path relative to API root url.
 * @param path Relative path to the configured API endpoint
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function get(path: string, options?: Options): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('get', path, null, axiosOptions));
}

/**
 * POST JSON to a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function post(
  path: string,
  body?: any,
  options?: Options
): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('post', path, body, axiosOptions));
}

/**
 * PUT JSON to a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function put(
  path: string,
  body: any,
  options?: Options
): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('put', path, body, axiosOptions));
}

/**
 * DELETE a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param options Axios options (optional)
 * @returns Promise of response body
 */
export async function del(path: string, options?: Options): Promise<any> {
  const axiosOptions = getAxiosOptions(options);
  return bodyOf(request('delete', path, null, axiosOptions));
}

function getAxiosOptions(options): any {
  let axiosOptions = { suppressRedBox: true };
  if (options && options.suppressRedBox == undefined) {
    axiosOptions = { ...options, suppressRedBox: true };
  }
  if (options && options.suppressRedBox !== undefined) {
    axiosOptions = options;
  }
  return axiosOptions;
}

/**
 * Make arbitrary axios request to a path relative to API root url
 *
 * @param method One of: get|post|put|delete
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param options: Axios options
 */
export async function request(
  method: string,
  path: string,
  body: any,
  options: Options
) {
  try {
    const response = await sendRequest(method, path, body, options);
    return handleResponse(path, response);
  } catch (error) {
    if (!options.suppressRedBox) {
      logError(error, path, method);
    }
    if (
      error.message === 'Network request failed' ||
      error.message.includes('timeout')
    ) {
      error.message = I18n.t('alerts.network_error');
    }
    throw error;
  }
}

/**
 * Constructs and fires a HTTP request
 */
async function sendRequest(method, path, body, options) {
  try {
    let headers = getRequestHeaders(body);
    if (options.token !== undefined) {
      headers = { ...headers, Authorization: options.token };
    }
    let allOptions: Options = {
      method,
      headers,
      url: path,
      timeout: options.timeout !== undefined ? options.timeout : TIMEOUT,
      validateStatus: function(status) {
        return status >= 200 && status < 500;
      },
    };
    if (options.onUploadProgress)
      allOptions.onUploadProgress = options.onUploadProgress;
    if (options.cancelToken) allOptions.cancelToken = options.cancelToken;
    if (body) allOptions.data = body;

    return axios(allOptions);
  } catch (e) {
    throw new Error(e);
  }
}

/**
 * Receives and reads a HTTP response
 */
async function handleResponse(path, response) {
  try {
    const status = response.status;

    // `axios` is configured to resolve even if HTTP status indicates failure.
    // Re-route promise flow control to interpret error responses as failures
    if (status >= 400) {
      // const error = new Error({status: status, message: message});

      let error = { status, message: response.data.message };
      if (Object.keys(response.data).length > 1) {
        error = { ...error, data: response.data };
      }
      throw error;
    }

    return {
      status: response.status,
      headers: response.headers,
      body: response.data,
    };
  } catch (e) {
    throw e;
  }
}

function getRequestHeaders(body): Headers {
  const headers = body
    ? { Accept: 'application/json', 'Content-Type': 'application/json' }
    : { Accept: 'application/json' };

  return headers;
}

async function bodyOf(requestPromise): Promise<any> {
  try {
    const response = await requestPromise;
    return response.body;
  } catch (e) {
    throw e;
  }
}

/**
 * Make best effort to turn a HTTP error or a runtime exception to meaningful error log message
 */
function logError(error, endpoint, method) {
  if (error.status) {
    const summary = `(${error.status} ${error.statusText}): ${error._bodyInit}`;
    console.error(
      `API request ${method.toUpperCase()} ${endpoint} responded with ${summary}`
    );
  } else {
    console.error(
      `API request ${method.toUpperCase()} ${endpoint} failed with message "${
        error.message
      }"`
    );
  }
}

export function getUser(userId: string): Promise<UserData> {
  return new Promise((resolve, reject) => {
    get(`/api/users/${userId}`)
      .then((res: UserData) => resolve(res))
      .catch(err => reject(err));
  });
}

export function getFollowers(
  userId: string,
  token: string
): Promise<Array<UserData> | Error> {
  return new Promise((resolve, reject) => {
    get(`/api/users/${userId}/followers`, { token })
      .then(res => resolve(res.data))
      .catch(err => reject(err));
  });
}

export function getProduct(uuid: string): Promise<Product> {
  return new Promise((resolve, reject) => {
    get(`/api/products/${uuid}`)
      .then(({ data }) => resolve(data))
      .catch(e => reject(e));
  });
}

export function getOrders(token: string): Promise<Array<Order>> {
  return new Promise((resolve, reject) => {
    get('/api/orders/', { token })
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}

export function getOrder(orderId: string, token: string): Promise<Order> {
  return new Promise((resolve, reject) => {
    get(`/api/orders/${orderId}`, { token })
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}

export function createOrder(
  uuid: string,
  token: string
): Promise<Order | Error> {
  return new Promise((resolve, reject) => {
    post('/api/orders', { product: uuid }, { token })
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}

export function sendChatPhoto(photo: any, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('photo', photo);
    post('/api/photos/upload-chat-images', fd, { token })
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}

export function uploadTempImage(
  path: string,
  token: string,
  onUploadProgress?: any => void,
  timeout: number = 30000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: path,
      type: 'image/jpeg',
      name: 'image.jpg',
    });
    post('/api/photos/upload', formData, { token, onUploadProgress, timeout })
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}

export type APIError = {
  status: number,
  message: string,
};

export type Headers = {
  Accept: string,
  'Content-Type'?: string,
};
