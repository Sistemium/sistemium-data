import defaultAxios, { axiosInstance } from './axios';
import isString from 'lodash/isString';

export const OP_MERGE = 'merge';
export const OP_CREATE = 'createOne';
export const OP_FIND_ONE = 'findOne';
export const OP_FIND_MANY = 'findMany';
export const OP_DELETE_ONE = 'deleteOne';

export default class Model {

  static setAxios(axios) {
    this.customAxios = axios;
  }

  static setStoreAdapter(storeAdapter) {

    this.storeAdapter = storeAdapter;

    const axios = axiosInstance({
      adapter: config => storeAdapter.requestAdapter(config),
      transformRequest: config => storeAdapter.transformRequest(config),
      transformResponse: config => storeAdapter.transformResponse(config),
    });

    this.setAxios(axios);

  }

  static setBaseURL(url) {
    this.staticBaseURL = url;
  }

  baseUrl() {
    return this.constructor.staticBaseURL;
  }

  axios() {
    return this.constructor.customAxios || defaultAxios;
  }

  requestConfig(config = {}) {
    return {
      baseURL: this.baseUrl(),
      collection: this.collection,
      ...config,
    };
  }

  constructor(config) {
    const {
      collection,
      schema,
    } = config;
    this.schema = schema;
    this.collection = collection;
    const { storeAdapter } = this.constructor;
    if (storeAdapter) {
      storeAdapter.setupModel(collection, { schema });
    }
  }

  async findAll(filter = {}, options = {}) {
    const config = this.requestConfig({ op: OP_FIND_MANY, params: filter, ...options });
    return this.axios()
      .get(this.collection, config);
  }

  async merge(array = [], options = {}) {
    const config = this.requestConfig({ op: OP_MERGE, data: array, ...options });
    return this.axios()
      .post(this.collection, array, config);
  }

  async findOne(resourceId, options = {}) {

    if (!resourceId) {
      throw new Error('findOne requires resourceId');
    }

    if (!isString(resourceId)) {
      throw new Error('findOne requires String resourceId');
    }

    const url = `${this.collection}/${resourceId}`;
    const config = this.requestConfig({ op: OP_FIND_ONE, resourceId, ...options });

    return this.axios()
      .get(url, config);

  }

  async createOne(props, options = {}) {
    const config = this.requestConfig({ op: OP_CREATE, ...options });
    return this.axios()
      .post(this.collection, props, config);
  }

  async destroy(resourceId, options = {}) {

    if (!resourceId) {
      throw new Error('destroy requires resourceId');
    }

    if (!isString(resourceId)) {
      throw new Error('destroy requires String resourceId');
    }

    const url = `${this.collection}/${resourceId}`;
    const config = this.requestConfig({ op: OP_DELETE_ONE, resourceId, ...options });

    return this.axios()
      .delete(url, config);

  }

  async create() {
    return this.createOne.apply(this, arguments);
  }

  async find() {
    return this.findAll.apply(this, arguments);
  }

}
