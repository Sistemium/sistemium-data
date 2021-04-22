import settle from 'axios/lib/core/settle';
import upperCase from 'lodash/upperCase';
import isObject from 'lodash/isObject';
import assert from 'assert';
import log from 'sistemium-debug';
import StoreAdapter from './StoreAdapter';
import { Schema, model } from 'mongoose';

const { debug, error } = log('MongoAdapter');

export default class MongoStoreAdapter extends StoreAdapter {

  constructor(options = {}) {
    super();
    this.mongoose = options.mongoose;
    assert(this.mongoose, 'mongoose option is required');
  }

  setupModel(name, { schema }) {
    super.setupModel(name, model(name, new Schema(schema)));
  }

  async requestAdapter(config) {

    const { method, collection, data: requestData } = config;
    const model = this.getStoreModel(collection);
    let status = 501;
    let statusText = 'Not implemented yet';
    let data = null;

    try {
      switch (upperCase(method)) {
        case 'GET':
          debug(method);
          break;
        case 'POST':
          debug(method, requestData);
          assert(isObject(requestData), 'POST requires object');
          data = await model.create(requestData);
          status = 201;
          break;
        default:
          debug(method);
      }
    } catch (e) {
      status = 503;
      statusText = e.message;
      error(e);
    }

    return new Promise((resolve, reject) => {
      settle(resolve, reject, {
        data,
        status,
        statusText,
        config,
      });
    });

  }

  transformRequest(data) {
    return data;
  }

  transformResponse(data) {
    return data;
  }

}
