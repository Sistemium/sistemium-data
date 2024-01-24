import Model, { BaseItem, ModelConfig, ModelRequestConfig, OP_DELETE_ONE, RequestOptions } from './Model';
import matches, { PredicateFn } from './util/predicates';
import { OFFSET_HEADER } from './Model';
import filter from 'lodash/filter';
import uniq from 'lodash/uniq';
import { AxiosResponse } from 'axios';

const toOneColumnRe = /.+Id$/;

export const CACHE_RESPONSE_OPTION = 'cacheResponse'

export function assert(test: any, message = 'Assertion failed') {
  if (!test) {
    throw new Error(message);
  }
}

export interface CachedRequestConfig extends ModelRequestConfig {
  [CACHE_RESPONSE_OPTION]?: boolean
  model: CachedModel
}

export interface CachedRequestOptions extends RequestOptions {
  once?: boolean
  cached?: boolean
}

type KeyType = string | number | boolean
type CachedIndex<T = BaseItem> = Map<KeyType, T>

export default class CachedModel<T extends BaseItem = BaseItem> extends Model<T> {

  indices: Map<string, CachedIndex<T>> = new Map();
  byOneIndices: Map<string, CachedIndex<CachedIndex<T>>> = new Map();
  primaryIndex: CachedIndex<T> = new Map();
  private $cachedFetches: Map<string, BaseItem> = new Map();

  constructor(config: ModelConfig) {
    super(config);
    this.clearCache();
  }

  /**
   * Override for custom predicate implementation
   */

  static matcher(filter: BaseItem | PredicateFn) {
    return matches(filter);
  }

  /**
   * Override for custom predicate implementation
   */

  toOneColumns(): string[] {
    const { schema } = this;
    return Object.keys(schema).filter(name => toOneColumnRe.test(name));
  }


  /**
   * Manages cache by intercepting axios responses
   */

  static responseInterceptor(response: AxiosResponse & { config: CachedRequestConfig }) {
    const { data, config } = response;
    const { model, op, resourceId } = config;
    if (config[CACHE_RESPONSE_OPTION] !== false) {
      if (op === OP_DELETE_ONE) {
        model.eject(resourceId as string);
      } else if (Array.isArray(data)) {
        model.addManyToCache(data);
      } else if (data) {
        model.addToCache(data);
      }
    }
    return Model.responseInterceptor(response);
  }

  /**
   * Create a map index
   */

  defineIndex(keys: string[] = []) {
    const index = new Map();
    this.indices.set(keys.join('|'), index);
    return index;
  }

  /**
   * Get one cached record by id
   */

  getByID(id: string): T | undefined {
    // assert(id, 'getByID requires id');
    return id ? this.primaryIndex.get(id) : undefined;
  }

  /**
   * Get array of indexed records
   */

  getManyByIndex(column: string, value: KeyType): T[] {
    const index = this.byOneIndices.get(column);
    assert(index, `column ${column} is not indexed`);
    const map = index?.get(value);
    return map ? Array.from(map.values()) : [];
  }

  /*
   * Add a record with ID to the cache
   */

  addToCache(record: T) {
    assert(record, 'addToCache requires record');
    const id = record[this.idProperty];
    assert(id, 'addToCache requires record id');
    const oldRecord = this.getByID(id);
    this.primaryIndex.set(id, record);
    this.updateByOneIndices(record, oldRecord);
  }

  /**
   * Update by-one index data
   */

  private updateByOneIndices(record: T, oldRecord?: T) {
    const id = record[this.idProperty];
    this.byOneIndices.forEach((index, column) => {
      const value = record[column] || null;
      if (oldRecord) {
        const oldValue = oldRecord[column] || null;
        if (value !== oldValue) {
          index.get(oldValue)?.delete(id);
        }
      }
      const stored = index.get(value);
      if (!stored) {
        index.set(value, new Map([[id, record]]));
      } else {
        stored.set(id, record);
      }
    });
  }

  /**
   * Add an array of records to cache
   */

  addManyToCache(records: T[]) {
    assert(Array.isArray(records), 'addManyToCache requires array of records');
    records.forEach(record => this.addToCache(record));
  }

  /**
   * Remove from cache by id
   */

  eject(id: string) {
    assert(id, 'eject requires id');
    const record = this.primaryIndex.get(id);
    this.primaryIndex.delete(id);
    if (!record) {
      return
    }
    this.byOneIndices.forEach((index, column) => {
      const value = record[column] || null;
      index.get(value)?.delete(id);
    });
  }

  /**
   * Get an array of records from cache with optional filter
   */

  filter(filter: BaseItem | PredicateFn = {}): T[] {
    const res: T[] = [];
    const isMatch = (this.constructor as typeof CachedModel).matcher(filter);
    this.primaryIndex.forEach(record => isMatch(record) && res.push(record));
    return res;
  }

  /**
   * Empty caches
   */

  clearCache() {
    // this.cache = [];
    this.indices = new Map();
    this.byOneIndices = new Map();
    this.primaryIndex = this.defineIndex([this.idProperty]);
    this.toOneColumns()
      .forEach(column => {
        this.byOneIndices.set(column, this.defineIndex([column]));
      });
    this.$cachedFetches = new Map();
  }

  cachedFetches(key: string) {
    return this.$cachedFetches.get(key) || {};
  }

  setCachedFetch(key: string, data: BaseItem = {}) {
    this.$cachedFetches.set(key, data);
  }

  /**
   * Fetch by offset cached by filter
   */

  async cachedFetch(filter: BaseItem = {}, options: CachedRequestOptions = {}) {

    const key = JSON.stringify(filter || {});
    const { offset } = this.cachedFetches(key);

    if (offset && options.once) {
      return [];
    }

    const nextOffset = options.offset || offset || '*';

    return this.fetchAll(filter, { headers: { [OFFSET_HEADER]: nextOffset } })
      .then(res => {
        const lastOffset = res[OFFSET_HEADER];
        if (lastOffset) {
          this.setCachedFetch(key, { offset: lastOffset });
        }
        return res;
      });

  }

  /**
   * Don't continue fetch after offset
   */

  async fetchOnce(filter: BaseItem = {}, options: CachedRequestOptions = {}) {
    return this.cachedFetch(filter, { ...options, once: true });
  }

  /**
   * Perform chunked find with id filter
   */

  async findByMany(ids: string[], options: CachedRequestOptions = {}) {
    const idsUniq = filter(uniq(ids));
    const toLoad = options.cached ? idsUniq.filter(id => !this.getByID(id)) : idsUniq;
    return super.findByMany(toLoad, options);
  }

}
