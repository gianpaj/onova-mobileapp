// @flow

import axios from 'axios';
import type { CancelToken } from 'axios';

import I18n from '../i18n';

import type { City, Department, Order, Product, UserData } from '../types';

const NODE_ENV = process.env.NODE_ENV;
let config: {
  API_URL: string,
  URL_BASE: string,
  SENDBIRD_APP_ID: string,
  SENTRY_URL: string,
  SEGMENT_API: string,
};

let isProd = false;
if (NODE_ENV === 'prod' || NODE_ENV === 'production') {
  isProd = true;
  config = require('../../config-dev.json');
} else {
  config = require('../../config-prod.json');
}

const analyticsEnabled = !__DEV__;

export { isProd, analyticsEnabled, config };

if (!global.__TESTING__) console.debug(`connecting to ${config.API_URL}`);

axios.defaults.baseURL = config.API_URL;
axios.defaults.timeout = 20000;

// axios.interceptors.response.use(null, error => {
//   if (error.config && error.response && error.response.status === 401) {
//     return updateToken().then(token => {
//       console.log(token);
//       // error.config.headers.xxxx <= set the token
//       return axios.request(error.config);
//     });
//   }

//   return Promise.reject(error);
// });

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
export async function post(path: string, body?: any, options?: Options): Promise<any> {
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
export async function put(path: string, body: any, options?: Options): Promise<any> {
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
export async function request(method: string, path: string, body: any, options: Options) {
  try {
    const response = await sendRequest(method, path, body, options);
    return handleResponse(path, response);
  } catch (error) {
    if (!options.suppressRedBox) {
      logError(error, path, method);
    }
    if (error.message === 'Network request failed' || error.message.includes('timeout')) {
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
    const allOptions: Options = {
      method,
      headers,
      url: path,
      ...(options.timeout ? { timeout: options.timeout } : {}),
      validateStatus: function(status) {
        return status >= 200 && status <= 500;
      },
    };
    if (options.onUploadProgress) allOptions.onUploadProgress = options.onUploadProgress;
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
  const { status, data, headers } = response;

  // `axios` is configured to resolve even if HTTP status indicates failure.
  // Re-route promise flow control to interpret error responses as failures
  if (status >= 400) {
    // const error = new Error({status: status, message: message});

    let error = { status, message: data.message };
    if (Object.keys(data).length > 1) {
      error = { ...error, data };
    }
    throw error;
  }

  return {
    status,
    headers,
    body: data,
  };
}

function getRequestHeaders(body): Headers {
  return body ? { Accept: 'application/json', 'Content-Type': 'application/json' } : { Accept: 'application/json' };
}

async function bodyOf(requestPromise): Promise<any> {
  const response = await requestPromise;
  return response.body;
}

/**
 * Make best effort to turn a HTTP error or a runtime exception to meaningful error log message
 */
function logError(error, endpoint, method) {
  if (error.status) {
    const summary = `(${error.status} ${error.statusText}): ${error._bodyInit}`;
    console.error(`API request ${method.toUpperCase()} ${endpoint} responded with ${summary}`);
  } else {
    console.error(`API request ${method.toUpperCase()} ${endpoint} failed with message "${error.message}"`);
  }
}

export function getUser(userId: string): Promise<UserData> {
  return new Promise((resolve, reject) => {
    get(`/api/users/${userId}`)
      .then((res: UserData) => resolve(res))
      .catch(err => reject(err));
  });
}

export function getUserWeb(userId: string, token: string): Promise<UserData> {
  return new Promise((resolve, reject) => {
    get(`/api/users-web/${userId}`, { token })
      .then((res: UserData) => resolve(res))
      .catch(err => reject(err));
  });
}

export function getFollowing(userId: string, token: string, limit = 500): Promise<Array<UserData> | Error> {
  return new Promise((resolve, reject) => {
    get(`/api/users/${userId}/following?limit=${limit}`, { token })
      .then(res => resolve(res.data))
      .catch(err => reject(err));
  });
}

export function getFollowers(userId: string, token: string, limit = 500): Promise<Array<UserData> | Error> {
  return new Promise((resolve, reject) => {
    get(`/api/users/${userId}/followers?limit=${limit}`, { token })
      .then(res => resolve(res.data))
      .catch(err => reject(err));
  });
}

export function getSuggestions(token: string): Promise<any> {
  return get('/api/suggested-users/', { token });
}

export function getProduct(uuid: string, options: Options = {}): Promise<Product> {
  return new Promise((resolve, reject) => {
    get(`/api/products/${uuid}`, options)
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

export function getCities(token: string): Promise<Array<City>> {
  return new Promise((resolve, reject) => {
    get('/api/shipping/cities', { token })
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}

export function getDepartments(cityID: string): Promise<Array<Department>> {
  return new Promise((resolve, reject) => {
    get(`/api/shipping/departments/${cityID}`)
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}
export function getShippingCosts(
  price: string,
  weight?: number,
  orderId: string,
  recipientOfficeID: string,
  token: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let weightQuery = '';
    if (weight) weightQuery = `&weight=${weight}`;
    get(`/api/shipping/costs/?price=${price}${weightQuery}&orderId=${orderId}&recipientOfficeID=${recipientOfficeID}`, {
      token,
    })
      .then(({ data }) => resolve(data))
      .catch(err => reject(err));
  });
}

export function createOrder(uuid: string, token: string): Promise<Order | Error> {
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
  cancelToken?: CancelToken,
  timeout: number = 30000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: path,
      type: 'image/jpeg',
      name: 'image.jpg',
    });
    post('/api/photos/upload', formData, {
      cancelToken,
      token,
      onUploadProgress,
      timeout,
    })
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
