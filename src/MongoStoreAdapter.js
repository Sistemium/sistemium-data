import settle from 'axios/lib/core/settle';
import upperCase from 'lodash/upperCase';
import isObject from 'lodash/isObject';
import assert from 'assert';
import log from 'sistemium-debug';
import StoreAdapter from './StoreAdapter';
import { Schema, model as mongooseModel } from 'mongoose';

const { debug, error } = log('MongoAdapter');

export default class MongoStoreAdapter extends StoreAdapter {

  // constructor(options = {}) {
  //   super();
  //   this.connection = options.connection;
  // }

  setupModel(name, { schema }) {
    const model = mongooseModel(name, new Schema(schema));
    super.setupModel(name, model);
  }

  async requestAdapter(config) {

    const { method, collection, data: requestData } = config;
    const model = this.getStoreModel(collection);
    const { resourceId, params = {} } = config;
    const { idProperty } = this;
    let status = 501;
    let statusText = 'Not implemented yet';
    let data = null;

    try {
      switch (upperCase(method)) {
        case 'GET':
          if (resourceId) {
            debug(method, resourceId);
            data = await model.findOne({ [idProperty]: resourceId });
            status = data ? 200 : 404;
          } else {
            debug(method, params);
            data = await model.find(params);
            status = data.length ? 200 : 204;
          }
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
