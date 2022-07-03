import get from 'lodash/get';
import set from 'lodash/set';
import assign from 'lodash/assign';
import isArray from 'lodash/isArray';
import first from 'lodash/first';

const STM_ANDROID_KEY = 'stmAndroid';
const IOS_MESSAGE_HANDLERS_KEY = 'webkit.messageHandlers';
const STM_CALLBACK = 'iSistemiumIOSCallback';
const STM_ERROR_CALLBACK = 'iSistemiumIOSErrorCallback';
const ARRAY_MESSAGE_CALLBACK = 'arrayMessageCallback';
const MESSAGE_CALLBACK = 'messageCallback';

let requestIdCounter = 0;
let tabBarShown = true;

const messages = {};
const messageHandlers = get(window, STM_ANDROID_KEY) || get(window, IOS_MESSAGE_HANDLERS_KEY);

if (window[ARRAY_MESSAGE_CALLBACK]) {
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

  return !!window.webkit || !!window.stmAndroid;

}

export function checkIn(desiredAccuracy, requiredAccuracy, data, timeout) {

  return message('checkin', {
    accuracy: desiredAccuracy,
    requiredAccuracy,
    data,
    timeout: timeout || 20000,
  });

}

export function handler(name) {

  if (messageHandlers && messageHandlers[name] && messageHandlers[name].postMessage) {

    return messageHandlers[name];

  }

  if (messageHandlers[name]) {

    return {
      postMessage: options => {

        const jsonOptions = options ? JSON.stringify(options) : undefined;

        messageHandlers[name](jsonOptions);

      },
    };

  }

  return {
    postMessage: () => {
      throw new Error(`IOS handler undefined call to: "${name}"`);
    },
  };

}

function message(handlerName, cfg) {

  return new Promise((resolve, reject) => {

    requestIdCounter += 1;

    const requestId = requestIdCounter;

    const msg = assign({
      requestId,
      callback: MESSAGE_CALLBACK,
      options: {},
    }, cfg);

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

function messageCallback(res, req) {

  const msg = messages[req.requestId];

  if (!msg) {
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

function arrayMessageCallback(res, req) {

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

  return message('roles');

}

export function requestFromDevice(type, params) {

  const msg = {
    callback: ARRAY_MESSAGE_CALLBACK,
    ...params,
  };

  return message(type, msg);

}

/*
Pictures
 */

export function takePhoto(entityName, data) {
  return message('takePhoto', { entityName, data });
}

export function supportsPictures() {
  return !!window.webkit;
}

export function loadImage({ id }) {
  return message('loadImage', { imageID: id });
}
