// @flow

import axios from 'axios';
// $FlowFixMe
import { AsyncStorage } from 'react-native';

axios.defaults.baseURL = 'http://localhost:4040';
const TIMEOUT = 4000;

/**
 * GET a path relative to API root url.
 * @param path Relative path to the configured API endpoint
 * @param suppressRedBox If true, no warning is shown on failed request
 * @returns Promise of response body
 */
export async function get(
  path: string,
  suppressRedBox: boolean = true
): Promise<any> {
  return bodyOf(request('get', path, null, suppressRedBox));
}

/**
 * POST JSON to a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param suppressRedBox If true, no warning is shown on failed request
 * @returns Promise of response body
 */
export async function post(
  path: string,
  body?: any,
  suppressRedBox: boolean = true
): Promise<any> {
  return bodyOf(request('post', path, body, suppressRedBox));
}

/**
 * PUT JSON to a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param suppressRedBox If true, no warning is shown on failed request
 * @returns Promise of response body
 */
export async function put(
  path: string,
  body: any,
  suppressRedBox: boolean = true
): Promise<any> {
  return bodyOf(request('put', path, body, suppressRedBox));
}

/**
 * DELETE a path relative to API root url
 * @param path Relative path to the configured API endpoint
 * @param suppressRedBox If true, no warning is shown on failed request
 * @returns Promise of response body
 */
export async function del(
  path: string,
  suppressRedBox: boolean = true
): Promise<any> {
  return bodyOf(request('delete', path, null, suppressRedBox));
}

/**
 * Make arbitrary axios request to a path relative to API root url
 *
 * @param method One of: get|post|put|delete
 * @param path Relative path to the configured API endpoint
 * @param body Anything that you can pass to JSON.stringify
 * @param suppressRedBox If true, no warning is shown on failed request
 */
export async function request(
  method: string,
  path: string,
  body: any,
  suppressRedBox: boolean
) {
  try {
    const response = await sendRequest(method, path, body);
    return handleResponse(path, response);
  } catch (error) {
    if (!suppressRedBox) {
      logError(error, path, method);
    }
    if (error.message == 'Network request failed') {
      error.message =
        'Please check your Internetz. Issue connecting with Onova servers';
    }
    throw error;
  }
}

async function getAuthenticationToken(): Promise<string> {
  return AsyncStorage.getItem('persist:primary').then(data => {
    const object = JSON.parse(JSON.parse(data).data);
    return object ? object.token : null;
  });
}

/**
 * Constructs and fires a HTTP request
 */
async function sendRequest(method, path, body) {
  try {
    const headers = await getRequestHeaders(body);
    const defaults = {
      method,
      headers,
      url: path,
      timeout: TIMEOUT,
      validateStatus: function(status) {
        return status >= 200 && status < 500;
      },
    };
    const options = body ? { ...defaults, data: body } : defaults;

    return axios(options);
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

      // throw error;
      throw { status, message: response.data.message };
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

async function getRequestHeaders(body) {
  const headers = body
    ? { Accept: 'application/json', 'Content-Type': 'application/json' }
    : { Accept: 'application/json' };

  const token = await getAuthenticationToken();
  if (token) {
    return { ...headers, Authorization: token };
  }

  return headers;
}

async function bodyOf(requestPromise) {
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
      `API request ${method.toUpperCase()} ${endpoint} responded with ${
        summary
      }`
    );
  } else {
    console.error(
      `API request ${method.toUpperCase()} ${endpoint} failed with message "${
        error.message
      }"`
    );
  }
}

export type APIError = {
  status: number,
  message: string,
};
