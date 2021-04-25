import settle from 'axios/lib/core/settle';
import isObject from 'lodash/isObject';
import assert from 'assert';
import log from 'sistemium-debug';
import StoreAdapter from './StoreAdapter';
import defaultMongoose, { Schema, model as mongooseModel } from 'mongoose';
import * as m from './Model';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import fpOmitBy from 'lodash/fp/omitBy';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';

export const mongoose = defaultMongoose;

const { debug, error } = log('MongoAdapter');
const INTERNAL_FIELDS_RE = /^_/;
const omitInternal = fpOmitBy((val, key) => INTERNAL_FIELDS_RE.test(key));
const pickUndefined = obj => mapValues(pickBy(obj, val => val === undefined), () => 1);


export default class MongoStoreAdapter extends StoreAdapter {

  constructor(options = {}) {
    super();
    this.mongoose = options.mongoose;
  }

  connect(url = process.env.MONGO_URL) {
    return (this.mongoose || defaultMongoose).connect(`mongodb://${url}`, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
  }

  mongooseModel(name, schema) {
    return (this.mongoose ? this.mongoose.model : mongooseModel)(name, new Schema(schema));
  }

  setupModel(name, { schema }) {
    const model = this.mongooseModel(name, schema);
    super.setupModel(name, model);
  }

  async requestAdapter(config) {

    const { method } = config;
    const { op, collection, data: requestData } = config;
    const model = this.getStoreModel(collection);
    const { resourceId, params = {} } = config;
    const { idProperty } = this;

    let status = 501;
    let statusText = 'Not implemented yet';
    let data = null;

    try {
      switch (op) {

        case m.OP_FIND_ONE:
          debug(method, resourceId);
          assert(resourceId, 'Resource id is required for findOne');
          data = await model.findOne({ [idProperty]: resourceId });
          status = data ? 200 : 404;
          break;

        case m.OP_FIND_MANY:
          debug(method, params);
          data = await model.find(params);
          status = data.length ? 200 : 204;
          break;

        case m.OP_CREATE:
          debug(method, requestData);
          assert(isObject(requestData), 'Create requires object data');
          data = await model.create(requestData);
          status = 201;
          break;

        case m.OP_MERGE:
          debug(method, requestData ? requestData.length : null);
          assert(Array.isArray(requestData), 'Merge requires array data');
          data = await this.mergeFn(model, requestData);
          status = 201;
          break;

        case m.OP_DELETE_ONE:
          debug(method, resourceId);
          assert(resourceId, 'Resource id is required for deleteOne');
          await model.deleteOne({ [idProperty]: resourceId });
          status = 204;
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

  async mergeFn(mongooseModel, data, mergeBy = [this.idProperty]) {

    const ids = [];

    const ops = data.map(item => {

      const id = item[this.idProperty];
      const filter = pick(item, mergeBy);

      ids.push(id);

      return { updateOne: this.$updateOne(item, id, filter) };

    });

    // debug(JSON.stringify(ops));

    if (ops.length) {
      await mongooseModel.bulkWrite(ops, { ordered: false });
    }

    return ids;

  }


  $updateOne(props, id, filter, upsert = true) {

    const cts = new Date();
    const mergeBy = Object.keys(filter);
    const toOmit = ['ts', 'cts', this.idProperty, ...mergeBy];
    const $set = omitInternal(omit(props, toOmit));
    const $unset = pickUndefined($set);

    const update = {
      $set: omit($set, Object.keys($unset)),
      $unset,
      $setOnInsert: { cts, [this.idProperty]: id, ...filter },
      $currentDate: { ts: { $type: 'timestamp' } }
    };

    if (!Object.keys($unset).length) {
      delete update.$unset;
    }

    if (!Object.keys(update.$set).length) {
      delete update.$set;
    }

    return {
      filter,
      update,
      upsert,
    };

  }

}

