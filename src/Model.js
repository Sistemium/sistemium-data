import axios from './axios';
import isString from 'lodash/isString';
import StoreAdapter from './StoreAdapter';

export default class Model {

  static setAxios(axios) {
    this.customAxios = axios;
  }

  static setAdapter({ axiosAdapter, transformRequest, transformResponse }) {
    const axiosInstance = this.customAxios || axios;
    axiosInstance.defaults.adapter = axiosAdapter;
    if (transformRequest) {
      axiosInstance.defaults.transformRequest = transformRequest;
    }
    if (transformResponse) {
      axiosInstance.defaults.transformResponse = transformResponse;
    }
  }

  static setStoreAdapter(storeAdapter) {
    this.storeAdapter = storeAdapter;
    this.setAdapter({
      axiosAdapter: config => storeAdapter.requestAdapter(config),
      transformRequest: storeAdapter.transformRequest,
      transformResponse: storeAdapter.transformResponse,
    });
  }

  static setBaseURL(url) {
    this.staticBaseURL = url;
  }

  baseUrl() {
    return this.constructor.staticBaseURL;
  }

  axios() {
    return this.constructor.customAxios || axios;
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
