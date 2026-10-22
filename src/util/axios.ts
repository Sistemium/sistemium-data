import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios'

type SettleCallback = (response: any) => void
export type AxiosSettle = (resolve: SettleCallback, reject: SettleCallback, response: any) => void

/**
 * Request config option keeping the headers as they were passed to the request
 */
export const RAW_HEADERS_OPTION = 'o-raw-headers';

export type AdapterRequestConfig = AxiosRequestConfig & {
  [RAW_HEADERS_OPTION]?: Record<string, any>
}

/**
 * Request headers for custom adapters, with the original values.
 * axios 1.x turns header values into strings, but adapters receive objects
 * through headers (e.g. a mongo session) and numbers (e.g. page size).
 */
export function adapterHeaders(config: AdapterRequestConfig): Record<string, any> {
  return {
    ...config.headers,
    ...config[RAW_HEADERS_OPTION],
  };
}

function encode(val: string) {
  return encodeURIComponent(val)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']');
}

function isDate(val: any): val is Date {
  return Object.prototype.toString.call(val) === '[object Date]';
}

/**
 * Serializes params the way axios 0.x did: nested objects go as JSON, e.g. id={"$in":["a"]}.
 * axios 1.x would send them in brackets instead: id[$in][]=a
 */
export function serializeParams(params: any): string {
  if (typeof URLSearchParams !== 'undefined' && params instanceof URLSearchParams) {
    return params.toString();
  }
  const parts: string[] = [];
  const source = typeof params === 'object' ? params : [params];
  Object.entries(source).forEach(([key, val]) => {
    if (val === null || val === undefined) {
      return;
    }
    const isArray = Array.isArray(val);
    const name = isArray ? `${key}[]` : key;
    (isArray ? val : [val]).forEach((v: any) => {
      if (isDate(v)) {
        v = v.toISOString();
      } else if (v !== null && typeof v === 'object') {
        v = JSON.stringify(v);
      }
      parts.push(`${encode(name)}=${encode(String(v))}`);
    });
  });
  return parts.join('&');
}

export default axios.create({ paramsSerializer: serializeParams });

export function axiosInstance(config: AxiosRequestConfig) {
  return axios.create({ paramsSerializer: serializeParams, ...config });
}

/**
 * Resolves or rejects depending on the response status, same as axios internal settle,
 * which axios 1.x does not export
 */
const settle: AxiosSettle = (resolve, reject, response) => {
  const { validateStatus } = response.config;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
    return;
  }
  const code = response.status >= 400 && response.status < 500
    ? AxiosError.ERR_BAD_REQUEST
    : AxiosError.ERR_BAD_RESPONSE;
  reject(new AxiosError(
    `Request failed with status code ${response.status}`,
    code,
    response.config,
    response.request,
    response,
  ));
};

export { axios, settle };
