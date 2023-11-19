import get from 'lodash/get';
import set from 'lodash/set';
import isArray from 'lodash/isArray';
import first from 'lodash/first';
import { BaseItem } from '../Model';


const STM_ANDROID_KEY = 'stmAndroid';
const IOS_MESSAGE_HANDLERS_KEY = 'webkit.messageHandlers';
const STM_CALLBACK = 'iSistemiumIOSCallback';
const STM_ERROR_CALLBACK = 'iSistemiumIOSErrorCallback';
const ARRAY_MESSAGE_CALLBACK = 'arrayMessageCallback';
const MESSAGE_CALLBACK = 'messageCallback';
const SYNCER_INFO_CALLBACK = 'syncerInfoJSFunction';

export interface IOSParams {
  entity?: string
  entityName?: string
  options?: BaseItem
  id?: string
  imageID?: string
  data?: any
  where?: BaseItem
  accuracy?: number
  requiredAccuracy?: number
  timeout?: number
  [SYNCER_INFO_CALLBACK]?: string
  action?: string
}

interface IHandlerMessage extends IOSParams {
  requestId?: number
  status?: string
  callback?: string
}

let requestIdCounter = 0;
let tabBarShown = true;

type HandlerFn = (a?: IHandlerMessage) => void

type IMessageHandler = {
  postMessage: HandlerFn
}

interface IMessageHandlers {
  [name: string]: IMessageHandler
}

const messages: BaseItem = {};
const messageHandlers = (get(window, STM_ANDROID_KEY) || get(window, IOS_MESSAGE_HANDLERS_KEY)) as unknown as IMessageHandlers

if (get(window, ARRAY_MESSAGE_CALLBACK)) {
  console.error(ARRAY_MESSAGE_CALLBACK, 'already exists');
} else {
  set(window, ARRAY_MESSAGE_CALLBACK, arrayMessageCallback);
  set(window, MESSAGE_CALLBACK, messageCallback);
  set(window, STM_CALLBACK, arrayMessageCallback);
  set(window, STM_ERROR_CALLBACK, arrayMessageCallback);
}

// if (isNative()) {
//   toggleTabBar();
// }

export function setSyncerInfoCallback(callback: (e: any) => any) {
  set(window, SYNCER_INFO_CALLBACK, callback);
  return message(SYNCER_INFO_CALLBACK, { [SYNCER_INFO_CALLBACK]: SYNCER_INFO_CALLBACK });
}

export function toggleTabBar() {
  const action = isShownTabBar() ? 'hide' : 'show';
  handler('tabbar').postMessage({ action });
  tabBarShown = !tabBarShown;
  return isShownTabBar();
}

export function hideTabBar() {
  tabBarShown = false;
  return handler('tabbar')
    .postMessage({ action: 'hide' });
}

export function isShownTabBar() {
  return tabBarShown;
}

export function isNative() {
  // @ts-ignore
  return !!window.webkit || !!window.stmAndroid;
}

export function checkIn(desiredAccuracy: number, requiredAccuracy: number, data: any, timeout: number) {

  return message('checkin', {
    accuracy: desiredAccuracy,
    requiredAccuracy,
    data,
    timeout: timeout || 20000,
  });

}

export function handler(name: string): IMessageHandler {

  const fn = messageHandlers && messageHandlers[name]

  if (!fn) {
    return {
      postMessage: () => {
        throw new Error(`IOS handler undefined call to: "${name}"`);
      },
    };
  }

  return fn;

}

function message(handlerName: string, cfg: IOSParams): Promise<any> {

  return new Promise((resolve, reject) => {

    requestIdCounter += 1;

    const requestId = requestIdCounter;

    const msg = {
      ...cfg,
      requestId,
      callback: MESSAGE_CALLBACK,
      options: cfg.options || {},
    }

    msg.options.requestId = requestId;

    messages[requestId] = { resolve, reject, msg };

    handler(handlerName).postMessage(msg);

    if (cfg && cfg.timeout) {
      setTimeout(() => {
        delete messages[requestId];
        reject(new Error(`${handlerName} request timeout`));
      }, cfg.timeout);
    }

  });

}

function messageCallback(res: any, req: IHandlerMessage) {

  const msg = req.requestId && messages[req.requestId];

  if (!msg || !req.requestId) {
    return;
  }

  let { status } = req;

  if (!status) {
    status = isArray(res) ? 'resolve' : 'reject';
  }

  let result = res;

  if (status === 'resolve') {
    result = isArray(res) ? first(res) : res;
  }

  msg[status](result);

  delete messages[req.requestId];

}

function arrayMessageCallback(res: any, req: IHandlerMessage) {

  if (!req.requestId) {
    return;
  }

  const msg = messages[req.requestId];

  if (!msg) {
    return;
  }

  let { status } = req;

  if (!status) {
    status = isArray(res) ? 'resolve' : 'reject';
  }

  msg[status](res);

  delete messages[req.requestId];

}

export function getRoles() {
  return message('roles', {});
}

export async function requestFromDevice(type: string, params: IOSParams): Promise<BaseItem | BaseItem[]> {

  const msg = {
    callback: ARRAY_MESSAGE_CALLBACK,
    ...params,
  };

  return message(type, msg);

}

/*
Pictures
 */

export function takePhoto(entityName: string, data: any) {
  return message('takePhoto', { entityName, data });
}

export function supportsPictures() {
  // @ts-ignore
  return !!window.webkit;
}

export function loadImage({ id }: { id: string }) {
  return message('loadImage', { imageID: id });
}
