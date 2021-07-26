import isString from 'lodash/isString';
import whilstAsync from 'async/whilst';
import EventEmitter from 'events'
import defaultAxios, { axiosInstance } from './util/axios';

export const OP_MERGE = 'merge';
export const OP_CREATE = 'createOne';
export const OP_FIND_ONE = 'findOne';
export const OP_FIND_MANY = 'findMany';
export const OP_DELETE_ONE = 'deleteOne';

export const OFFSET_HEADER = 'x-offset';
export const SORT_HEADER = 'x-sort';
export const FULL_RESPONSE_OPTION = 'o-full-response';

export default class Model extends EventEmitter {

  constructor(config) {
    super(config);
    const {
      collection,
      schema,
      idProperty,
    } = config;
    this.idProperty = idProperty || this.constructor.defaultIdProperty();
    this.schema = schema;
    this.collection = collection;
    const { storeAdapter, plugins } = this.constructor;
    plugins.forEach(plugin => plugin.setup(this));
    if (storeAdapter) {
      storeAdapter.setupModel(collection, config);
    }
  }

  /**
   * ID field name
   * @returns {string}
   * @package
   */

  static defaultIdProperty() {
    return 'id';
  }

  /**
   * Configure with axios instance and setup interceptor
   * @param {import('axios').AxiosInstance} [axios]
   */

  static useAxios(axios) {
    this.customAxios = axios || defaultAxios;
    this.customAxios.interceptors.response.use(this.responseInterceptor);
  }

  /**
   * Makes responses by default returning data. Returns full response with option.
   * @param {object} response
   * @returns {object|import('axios').AxiosResponse}
   * @package
   */

  static responseInterceptor(response) {
    const { data, config } = response;
    return (config && config[FULL_RESPONSE_OPTION]) ? response : data;
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

  /**
   *
   * @param {ModelPlugin} plugin
   * @param name
   */

  static plugin(plugin, name = plugin.constructor.name) {
    this.plugins.set(name, plugin);
  }

  axios() {
    return this.constructor.customAxios || defaultAxios;
  }

  /**
   *
   * @param {object} config
   * @returns {{model: Model, collection: string}}
   */

  requestConfig(config) {
    return {
      model: this,
      collection: this.collection,
      ...config,
    };
  }

  /**
   * Find an array of records with optional filter
   * @param {object} [filter]
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */

  async find(filter = {}, options = {}) {
    const config = this.requestConfig({ op: OP_FIND_MANY, params: filter, ...options });
    return this.axios()
      .get(this.collection, config);
  }

  /**
   * Create or update an array of records
   * @param {object[]} array
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */

  async merge(array, options = {}) {
    const config = this.requestConfig({ op: OP_MERGE, data: array, ...options });
    return this.axios()
      .post(this.collection, array, config);
  }

  /**
   * Continuously fetch a large array of records page by page
   * @param {object} [filter]
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */

  async fetchAll(filter = {}, options = {}) {
    let { [OFFSET_HEADER]: offset = '*' } = options.headers || {};
    const results = [];
    let more = true;
    await whilstAsync(cb => cb(null, more), async () => {
      const o = {
        headers: { [OFFSET_HEADER]: offset },
        [FULL_RESPONSE_OPTION]: true,
      };
      const nextResponse = await this.find(filter, o);
      const { data, headers: { [OFFSET_HEADER]: nextOffset } = {} } = nextResponse;
      // console.log(nextResponse.headers);
      Array.prototype.push.apply(results, data || []);
      more = data && data.length && nextOffset && (nextOffset > offset);
      offset = nextOffset || offset;
    });
    results[OFFSET_HEADER] = offset;
    return results;
  }

  /**
   * Find one record by id
   * @param {string} resourceId
   * @param {object} [options]
   * @returns {Promise<object>}
   */

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

  /**
   * Create one record
   * @param {object} props
   * @param {object} [options]
   * @returns {Promise<object>}
   */

  async createOne(props, options = {}) {
    const config = this.requestConfig({ op: OP_CREATE, ...options });
    return this.axios()
      .post(this.collection, props, config);
  }

  /**
   * Delete one record by id
   * @param {string} resourceId
   * @param {object} [options]
   * @returns {Promise<*>}
   */

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

  /**
   * Alias to createOne
   * @param {object} props
   * @param {object} [options]
   * @returns {Promise<object>}
   */

  async create(props, options) {
    return this.createOne(props, options);
  }

  /**
   * Alias to find
   * @param {object} [filter]
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */

  async findAll(filter, options) {
    return this.find(filter, options);
  }

  /**
   * Find a record matching the filter
   * @param {object} [filter]
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */

  async findOne(filter, options) {
    return this.find(filter, options)
      .then(([res]) => res || null);
  }

  /**
   * Delete by id specified with filter object (introduced for mongo compatibility)
   * @param {Object} [filter]
   * @param {Object} [options]
   * @returns {Promise<*>}
   */

  async deleteOne(filter, options = {}) {
    const { [this.idProperty]: resourceId } = filter;
    return this.destroy(resourceId, options);
  }

}

Model.plugins = new Map();
