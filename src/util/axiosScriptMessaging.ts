import log from 'sistemium-debug';
import { settle } from './axios';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';
import { IOSParams, requestFromDevice } from './native';
import { BaseItem, ModelRequestConfig } from '../Model';

const {
  debug,
  error,
} = log('axios:script:messaging');

export const OFFSET_HEADER = 'x-offset';
export const PAGE_SIZE_HEADER = 'x-page-size';
export const SOCKET_SOURCE_HEADER = 'x-socket-source';

let REQUEST_ID = 0;

const OP_TYPES = new Map<string, string>([
  ['findMany', 'findAll'],
  ['findOne', 'find'],
  ['createOne', 'update'],
  ['deleteOne', 'destroy'],
]);

export default async function axiosScriptMessaging(config: ModelRequestConfig) {

  let data: any;
  let status = 200;
  let statusText = 'OK';

  REQUEST_ID += 1;

  try {
    data = await main(config, REQUEST_ID);
  } catch (e: any) {
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


async function main(config: ModelRequestConfig, requestId: number) {

  const {
    op,
    headers= {},
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

  const iosParams: IOSParams = {
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
  return (type === 'update' || type === 'find') && Array.isArray(res) ? res[0] : res;

}

type IWhereClause = string | number | {
  $in?: any[]
  like?: string
  likei?: string
}

function paramsToWhere(params: BaseItem) {
  const where: Record<string, IWhereClause> = params['where:'] || params;
  return mapValues(where, val => {
    if (isObject(val)) {
      if (val.$in) {
        return { in: val.$in };
      }
      if (val.like || val.likei) {
        return val;
      }
    }
    return { '==': val };
  });
}
