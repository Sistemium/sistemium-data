import isString from 'lodash/isString';
import { whilst as whilstAsync } from 'async';
import defaultAxios, { axiosInstance } from './util/axios';
import filter from 'lodash/filter';
import uniq from 'lodash/uniq';
import chunk from 'lodash/chunk';
import flatten from 'lodash/flatten';
import type { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AxiosAdapter, AxiosRequestTransformer, AxiosResponseTransformer } from 'axios';


export const OP_MERGE = 'merge';
export const OP_CREATE = 'createOne';
export const OP_UPDATE_ONE = 'updateOne';
export const OP_FIND_ONE = 'findOne';
export const OP_FIND_MANY = 'findMany';
export const OP_DELETE_ONE = 'deleteOne';
export const OP_AGGREGATE = 'aggregate';

enum OP {
  MERGE = OP_MERGE,
  CREATE = OP_CREATE,
  UPDATE_ONE = OP_UPDATE_ONE,
  FIND_ONE = OP_FIND_ONE,
  FIND_MANY = OP_FIND_MANY,
  DELETE_ONE = OP_DELETE_ONE,
  AGGREGATE = OP_AGGREGATE,
}

export const OFFSET_HEADER = 'x-offset';
export const SORT_HEADER = 'x-sort';
export const PAGE_SIZE_HEADER = 'x-page-size';
export const FULL_RESPONSE_OPTION = 'o-full-response';

export type BaseItem = Record<string, any>

export interface IModelPlugin {
  setup(model: Model<any>): void
}

export interface ModelConfig {
  collection: string
  schema: BaseItem
  idProperty?: string
}

export interface IStoreAdapter {
  getStoreModel(name: string): Model

  requestAdapter: AxiosAdapter
  transformRequest: AxiosRequestTransformer
  transformResponse: AxiosResponseTransformer

  setupModel(collection: string, config: ModelConfig): void
}

export interface ModelRequestConfig extends AxiosRequestConfig {
  model: Model<any>
  collection: string
  op: OP
  resourceId?: string
}

export interface RequestOptions extends BaseItem {
  headers?: BaseItem & {
    [OFFSET_HEADER]?: string,
    [PAGE_SIZE_HEADER]?: number,
    [SORT_HEADER]?: String,
  },
  [FULL_RESPONSE_OPTION]?: boolean
}

export interface FullResponse<T = object> {
  data: T[]
  headers: Record<string, any>
}

export type FullResponseOptions = RequestOptions & { [FULL_RESPONSE_OPTION]: true }

export default class Model<T = BaseItem> {

  idProperty: string
  schema: BaseItem
  collection: string
  static plugins: Map<string, IModelPlugin> = new Map()
  static storeAdapter: IStoreAdapter
  static customAxios: Axios

  constructor(config: ModelConfig) {
    const {
      collection,
      schema,
      idProperty,
    } = config;
    this.idProperty = idProperty || (this.constructor as typeof Model).defaultIdProperty();
    this.schema = schema;
    this.collection = collection;
    const { storeAdapter, plugins } = (this.constructor as typeof Model);
    plugins.forEach(plugin => plugin.setup(this));
    if (storeAdapter) {
      storeAdapter.setupModel(collection, config);
    }
  }

  /**
   * ID field name
   */

  static defaultIdProperty() {
    return 'id';
  }

  /**
   * Configure with axios instance and setup interceptor
   */

  static useAxios(axios?: Axios) {
    this.customAxios = axios || defaultAxios;
    this.customAxios.interceptors.response.use(this.responseInterceptor);
  }

  /**
   * Makes responses by default returning data. Returns full response with option.
   */

  static responseInterceptor(response: AxiosResponse & { config: { [FULL_RESPONSE_OPTION]?: boolean } }) {
    const { data, config } = response;
    return (config && config[FULL_RESPONSE_OPTION]) ? response : data;
  }

  static useStoreAdapter(storeAdapter: IStoreAdapter) {

    this.storeAdapter = storeAdapter;

    const axios = axiosInstance({
      adapter: config => storeAdapter.requestAdapter(config),
      transformRequest: config => storeAdapter.transformRequest(config),
      transformResponse: config => storeAdapter.transformResponse(config),
    });

    this.useAxios(axios);

    return this;

  }

  static plugin(plugin: IModelPlugin, name = plugin.constructor.name) {
    this.plugins.set(name, plugin);
  }

  axios() {
    return (this.constructor as typeof Model).customAxios || defaultAxios;
  }

  requestConfig(config: AxiosRequestConfig & { op: OP, resourceId?: string }): ModelRequestConfig {
    return {
      model: this,
      collection: this.collection,
      ...config,
    };
  }

  /**
   * Find an array of records with optional filter
   */

  async find(filter?: BaseItem): Promise<T[]>
  async find(filter?: BaseItem, options?: RequestOptions & { [FULL_RESPONSE_OPTION]: true }): Promise<FullResponse<T>>
  async find(filter: BaseItem = {}, options: RequestOptions = {}): Promise<T[] | FullResponse<T>> {
    const config = this.requestConfig({ op: OP.FIND_MANY, params: filter, ...options });
    return this.axios()
      .get(this.collection, config);
  }

  /**
   * Aggregate into an array with pipeline
   */

  aggregate<TA = T>(pipeline?: BaseItem[]): Promise<TA[]>
  aggregate<TA = T>(
    pipeline?: BaseItem[],
    fullResponseOptions?: FullResponseOptions,
  ): Promise<FullResponse<TA>>
  async aggregate<TA = T>(pipeline: BaseItem[] = [], options: RequestOptions = {}): Promise<TA[] | FullResponse<TA>> {
    const config = this.requestConfig({ op: OP.AGGREGATE, params: pipeline, ...options });
    return this.axios()
      .get(this.collection, config);
  }

  /**
   * Create or update an array of records
   */

  async merge(array: T[], options: RequestOptions = {}): Promise<any> {
    const config = this.requestConfig({ op: OP.MERGE, data: array, ...options });
    return this.axios()
      .post(this.collection, array, config);
  }

  /**
   * Continuously fetches a large array of records, page by page
   */

  async fetchAll(filter: BaseItem = {}, options: RequestOptions = {}): Promise<T[] & { [OFFSET_HEADER]?: string }> {
    const results: T[] & { [OFFSET_HEADER]?: string } = [];
    results[OFFSET_HEADER] = await this.fetchPaged(async (data) => {
      Array.prototype.push.apply(results, data || []);
    }, filter, options);
    return results;
  }

  /**
   * Continuously fetch a large array of records, page by page
   */

  async fetchPaged(onPage: (data: T[], offset: string) => Promise<void>, filter: BaseItem = {}, options: RequestOptions = {}) {
    const { headers = {} } = options;
    let offset: string = headers[OFFSET_HEADER] || '*';
    const { [PAGE_SIZE_HEADER]: pageSize } = headers;
    let more = true;

    await whilstAsync(cb => cb(null, more), async cb => {
      try {
        const nextResponse = await this.find(filter, {
          headers: {
            ...headers,
            [OFFSET_HEADER]: offset,
          },
          [FULL_RESPONSE_OPTION]: true,
        });
        const { data, headers: { [OFFSET_HEADER]: nextOffset } = {} } = nextResponse;
        more = data
          && data.length
          && nextOffset
          && (nextOffset > offset)
          && (!pageSize || data.length >= pageSize);
        offset = nextOffset || offset;
        if (data && data.length) {
          await onPage(data, nextOffset);
        }
        if (cb) {
          cb();
        }
      } catch (e: any) {
        if (cb) {
          cb(e);
        } else {
          throw e;
        }
      }
    });
    return offset;
  }

  /**
   * Find one record by id
   */

  async findByID(resourceId: string | number, options: RequestOptions = {}): Promise<T> {

    if (!resourceId) {
      throw new Error('findOne requires resourceId');
    }

    if (!isString(resourceId)) {
      throw new Error('findOne requires String resourceId');
    }

    const url = `${this.collection}/${resourceId}`;
    const config = this.requestConfig({ op: OP.FIND_ONE, resourceId, ...options });

    return this.axios()
      .get(url, config);

  }

  /**
   * Create one record
   */

  async createOne(props: Partial<T>, options: RequestOptions = {}): Promise<T> {
    const config = this.requestConfig({ op: OP.CREATE, ...options });
    return this.axios()
      .post(this.collection, props, config);
  }

  /**
   * Update one record, id required
   */

  async updateOne(props: BaseItem, options = {}): Promise<T> {
    const resourceId: string = props[this.idProperty];
    if (!resourceId) {
      throw new Error('updateOne requires resource id');
    }
    const url = `${this.collection}/${resourceId}`;
    const config = this.requestConfig({ op: OP.UPDATE_ONE, resourceId, ...options });
    return this.axios()
      .patch(url, props, config);
  }

  /**
   * Delete one record by id
   */

  async destroy(resourceId: string | number, options: RequestOptions = {}): Promise<void> {

    if (!resourceId) {
      throw new Error('destroy requires resourceId');
    }

    if (!isString(resourceId)) {
      throw new Error('destroy requires String resourceId');
    }

    const url = `${this.collection}/${resourceId}`;
    const config = this.requestConfig({ op: OP.DELETE_ONE, resourceId, ...options });

    return this.axios()
      .delete(url, config);

  }

  /**
   * Alias to createOne
   */

  async create(props: Partial<T>, options: RequestOptions = {}) {
    return this.createOne(props, options);
  }

  /**
   * Alias to find
   */

  async findAll(filter?: BaseItem, options: RequestOptions = {}) {
    // @ts-ignore
    return this.find(filter, options);
  }

  /**
   * Find a record matching the filter
   */

  async findOne(filter: BaseItem, options: RequestOptions = {}): Promise<T | null> {
    // @ts-ignore
    return this.find(filter, options)
      .then(([res]) => res || null);
  }

  /**
   * Delete by id specified with filter object (introduced for mongo compatibility)
   */

  async deleteOne(filter: BaseItem, options: RequestOptions = {}): Promise<void> {
    const { [this.idProperty]: resourceId } = filter;
    return this.destroy(resourceId, options);
  }

  /**
   * Perform chunked find with id filter
   */

  async findByMany(ids: string[], options: RequestOptions & { field?: string, chunkSize?: number } = {}) {

    const {
      chunkSize = 100,
      field = this.idProperty,
    } = options;

    const idsUniq = filter(uniq(ids));
    const chunks = chunk(idsUniq, chunkSize);

    const res = await Promise.all(chunks.map(chunkIds => {
      const where = { [field]: { $in: chunkIds } };
      return this.findAll(where);
    }));

    return flatten(res);

  }

}
