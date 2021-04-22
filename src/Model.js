import defaultAxios, { axiosInstance } from './axios';
import isString from 'lodash/isString';

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
    return this.axios()
      .get(this.collection, this.requestConfig({
        params: filter,
      }));
  }

  async findOne(resourceId, options = {}) {

    if (!resourceId) {
      throw new Error('findOne requires resourceId');
    }

    if (!isString(resourceId)) {
      throw new Error('findOne requires String resourceId');
    }

    const url = `${this.collection}/${resourceId}`;

    return this.axios()
      .get(url, this.requestConfig({ resourceId }));

  }

  async createOne(props, options = {}) {
    return this.axios()
      .post(this.collection, props, this.requestConfig(options));
  }

}
