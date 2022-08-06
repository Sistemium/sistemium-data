import log from 'sistemium-debug';
import settle from 'axios/lib/core/settle';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';
import { requestFromDevice } from './native';

const {
  debug,
  error,
} = log('axios:script:messaging');

export const OFFSET_HEADER = 'x-offset';
export const PAGE_SIZE_HEADER = 'x-page-size';
export const SOCKET_SOURCE_HEADER = 'x-socket-source';

let REQUEST_ID = 0;

const OP_TYPES = new Map([
  ['findMany', 'findAll'],
  ['findOne', 'find'],
  ['createOne', 'update'],
  ['deleteOne', 'destroy'],
]);

export default async function axiosScriptMessaging(config) {

  let data;
  let status = 200;
  let statusText = 'OK';

  REQUEST_ID += 1;

  try {
    data = await main(config, REQUEST_ID);
  } catch (e) {
    status = 503;
    statusText = e.message;
    error(e.message);
  }

  return new Promise((resolve, reject) => {
    settle(resolve, reject, {
      data,
      status,
      headers: {},
      statusText,
      config,
    });
  });

}

async function main(config, requestId) {

  const {
    op,
    headers,
    resourceId,
    params,
    collection,
    data: requestData,
  } = config;

  const type = OP_TYPES.get(op);

  debug('request:', requestId, collection, op, resourceId || params || requestData);

  if (!type) {
    throw new Error(`Unknown type for op ${op}`);
  }

  const options = {
    socketSource: headers[SOCKET_SOURCE_HEADER],
    pageSize: headers[PAGE_SIZE_HEADER],
  };

  const iosParams = {
    entity: collection,
    options,
    id: resourceId,
    data: requestData,
  };

  if (params && Object.keys(params).length) {
    iosParams.where = paramsToWhere(params);
  }

  const res = await requestFromDevice(type, iosParams);
  debug('response:', requestId, collection, op, res && res.length);
  return (type === 'update' || type === 'find') ? res[0] : res;

}


function paramsToWhere(params) {
  return mapValues(params, val => {
    if (isObject(val)) {
      if (val.$in) {
        return { in: val.$in };
      }
    }
    return { '==': val };
  });
}
