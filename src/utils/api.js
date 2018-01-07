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
    return JSON.parse(JSON.parse(data).data).token;
  });
}

/**
 * Constructs and fires a HTTP request
 */
async function sendRequest(method, path, body) {
  try {
    const token = await getAuthenticationToken();
    const headers = getRequestHeaders(body, token);
    const defaults = { method, headers, url: path, timeout: TIMEOUT };
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

    // `axios` promises resolve even if HTTP status indicates failure. Re-route
    // promise flow control to interpret error responses as failures
    if (status >= 400) {
      const message = await getErrorMessageSafely(response);
      // const error = new Error({status: status, message: message});

      // throw error;
      throw { status, message };
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

function getRequestHeaders(body, token) {
  const headers = body
    ? { Accept: 'application/json', 'Content-Type': 'application/json' }
    : { Accept: 'application/json' };

  if (token) {
    return { ...headers, Authorization: token };
  }

  return headers;
}

// try to get the best possible error message out of a response
// without throwing errors while parsing
async function getErrorMessageSafely(response) {
  try {
    const body = await response.text();
    // console.log('body', body);
    if (!body) {
      return '';
    }

    // Optimal case is JSON with a defined message property
    const payload = JSON.parse(body);
    if (payload && payload.message) {
      return payload.message;
    }

    // Should that fail, return the whole response body as text
    return body;
  } catch (e) {
    // Unreadable body, return whatever the server returned
    return response._bodyInit;
  }
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
