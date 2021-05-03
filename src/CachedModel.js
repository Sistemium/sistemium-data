import Model, { OP_DELETE_ONE } from './Model';
import assert from 'sistemium-mongo/lib/assert';
import matches from '../src/util/predicates';

export default class CachedModel extends Model {

  constructor(config) {
    super(config);
    this.clearCache();
  }

  /**
   * Override for custom predicate implementation
   * @param {object} filter
   * @returns {function(*): boolean}
   * @private
   */

  static matcher(filter) {
    return matches(filter);
  }

  /**
   * Manages cache by intercepting axios responses
   * @param {object} response
   * @returns {object|import('axios').AxiosResponse}
   * @package
   */

  static responseInterceptor(response) {
    const { data, config } = response;
    const { model, op, resourceId } = config;
    if (op === OP_DELETE_ONE) {
      model.eject(resourceId);
    } else if (Array.isArray(data)) {
      model.addManyToCache(data);
    } else if (data) {
      model.addToCache(data);
    }
    return Model.responseInterceptor(response);
  }

  /**
   * Create a map index
   * @param {string[]} keys
   * @returns {Map<string, any>}
   */

  defineIndex(keys = []) {
    const index = new Map();
    this.indices.set(keys.join('|'), index);
    return index;
  }

  /**
   * Get one cached record by id
   * @param {string} id
   * @returns {object}
   */

  getByID(id) {
    assert(id, 'getByID requires id');
    return this.primaryIndex.get(id);
  }

  /**
   * Add a record with ID to the cache
   * @param {object} record
   */

  addToCache(record) {
    assert(record, 'addToCache requires record');
    const { [this.idProperty]: id } = record;
    assert(id, 'addToCache requires record id');
    this.primaryIndex.set(id, record);
  }

  /**
   * Add an array of records to cache
   * @param {object[]} records
   */

  addManyToCache(records) {
    assert(Array.isArray(records), 'addManyToCache requires array of records');
    records.forEach(record => this.addToCache(record));
  }

  /**
   * Remove from cache by id
   * @param {string} id
   */

  eject(id) {
    assert(id, 'eject requires id');
    this.primaryIndex.delete(id);
  }

  /**
   * Get an array of records from cache with optional filter
   * @param {object} [filter]
   * @returns {object[]}
   */

  filter(filter = {}) {
    const res = [];
    const isMatch = this.constructor.matcher(filter);
    this.primaryIndex.forEach(record => isMatch(record) && res.push(record));
    return res;
  }

  /**
   * Empty caches
   */

  clearCache() {
    // this.cache = [];
    this.indices = new Map();
    this.primaryIndex = this.defineIndex([this.idProperty]);
  }

}
