import defaultAxios, { axiosInstance } from './axios';
import isString from 'lodash/isString';
import whilstAsync from 'async/whilst';
import EventEmitter from 'events'

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
      storeAdapter.setupModel(collection, { schema });
    }
  }

  static defaultIdProperty() {
    return 'id';
  }

  static useAxios(axios) {
    this.customAxios = axios || defaultAxios.create();
    this.customAxios.interceptors.response.use(this.responseInterceptor);
  }

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

  static setBaseURL(url) {
    this.staticBaseURL = url;
  }

  static plugin(plugin = {}, name = plugin.constructor.name) {
    this.plugins.set(name, plugin);
  }

  baseUrl() {
    return this.constructor.staticBaseURL;
  }

  axios() {
    return this.constructor.customAxios || defaultAxios;
  }

  requestConfig(config = {}) {
    return {
      model: this,
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
      const nextResponse = await this.find(filter, o);
      const { data = [], headers: { [OFFSET_HEADER]: nextOffset } = {} } = nextResponse;
      // console.log(nextResponse.headers);
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

  async deleteOne({ [this.idProperty]: resourceId }, options = {}) {
    return this.destroy(resourceId, options);
  }

}

Model.plugins = new Map();
