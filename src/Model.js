import defaultAxios, { axiosInstance } from './axios';
import isString from 'lodash/isString';
import whilstAsync from 'async/whilst';

export const OP_MERGE = 'merge';
export const OP_CREATE = 'createOne';
export const OP_FIND_ONE = 'findOne';
export const OP_FIND_MANY = 'findMany';
export const OP_DELETE_ONE = 'deleteOne';

export const OFFSET_HEADER = 'x-offset';
export const SORT_HEADER = 'x-sort';
export const FULL_RESPONSE_OPTION = 'o-full-response';

export default class Model {

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

  static useAxios(axios) {
    this.customAxios = axios || defaultAxios.create();
    this.customAxios.interceptors.response.use(response => {
      const { data, config } = response;
      return config[FULL_RESPONSE_OPTION] ? response : data;
    });
  }

  static useStoreAdapter(storeAdapter) {

    this.storeAdapter = storeAdapter;

    const axios = axiosInstance({
      adapter: config => storeAdapter.requestAdapter(config),
      transformRequest: config => storeAdapter.transformRequest(config),
      transformResponse: config => storeAdapter.transformResponse(config),
    });

    this.useAxios(axios);

    return this;

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

  async find(filter = {}, options = {}) {
    const config = this.requestConfig({ op: OP_FIND_MANY, params: filter, ...options });
    return this.axios()
      .get(this.collection, config);
  }

  async merge(array = [], options = {}) {
    const config = this.requestConfig({ op: OP_MERGE, data: array, ...options });
    return this.axios()
      .post(this.collection, array, config);
  }

  async fetchAll(filter = {}, options = {}) {
    let { [OFFSET_HEADER]: offset = '*' } = options.headers || {};
    const results = [];
    let more = true;
    await whilstAsync(cb => cb(null, more), async () => {
      const o = {
        headers: { [OFFSET_HEADER]: offset },
        [FULL_RESPONSE_OPTION]: true,
      };
      const { data = [], headers: { [OFFSET_HEADER]: nextOffset } = {} } = await this.find(filter, o);
      Array.prototype.push.apply(results, data);
      more = data && data.length && nextOffset && nextOffset > offset;
      offset = nextOffset || offset;
    });
    results[OFFSET_HEADER] = offset;
    return results;
  }

  async findByID(resourceId, options = {}) {

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

  async findAll() {
    return this.find.apply(this, arguments);
  }

  async findOne() {
    return this.find.apply(this, arguments)
      .then(res => (res && res.length) ? res[0] : null);
  }

}
