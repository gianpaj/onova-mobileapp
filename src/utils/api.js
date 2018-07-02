// @flow

import axios, { CancelTokenSource } from 'axios';
// eslint-disable-next-line
import type { Order, Product, UserData } from '../types';

let config;
if (process.env.NODE_ENV == 'prod' || process.env.NODE_ENV == 'production') {
  config = require('../../config-prod.json');
} else {
  config = require('../../config-dev.json');
}

console.debug(`connecting to ${config.API_URL}`);

axios.defaults.baseURL = config.API_URL;
const TIMEOUT = 10000;

type Options = {
  suppressRedBox?: boolean, // If true, no warning is shown on failed request
  cancelToken?: CancelTokenSource,
  timeout?: number,
  token?: string,
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
    if (error.message == 'Network request failed') {
      error.message =
        'Please check your Internetz. Issue connecting with Onova servers';
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
    const defaults = {
      method,
      headers,
      url: path,
      timeout: options.timeout !== undefined ? options.timeout : TIMEOUT,
      validateStatus: function(status) {
        return status >= 200 && status < 500;
      },
    };
    // $FlowFixMe
    defaults.cancelToken = options.cancelToken;
    const allOptions = body ? { ...defaults, data: body } : defaults;

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

export type APIError = {
  status: number,
  message: string,
};

export type Headers = {
  Accept: string,
  'Content-Type'?: string,
};
