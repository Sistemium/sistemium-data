import Model, { OP_DELETE_ONE } from './Model';
import assert from 'sistemium-mongo/lib/assert';
import matches from '../src/util/predicates';

const toOneColumnRe = /.+Id$/;

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
   * Override for custom predicate implementation
   * @returns {array}
   * @private
   */

  toOneColumns() {
    const { schema } = this;
    return Object.keys(schema).filter(name => toOneColumnRe.test(name));
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
    // assert(id, 'getByID requires id');
    return id && this.primaryIndex.get(id);
  }

  /**
   * Get array of indexed records
   * @param {string} column
   * @param {string|number|boolean} value
   * @returns {array}
   */

  getManyByIndex(column, value) {
    const index = this.byOneIndices.get(column);
    assert(index, `column ${column} is not indexed`);
    const map = index.get(value);
    return map ? Array.from(map.values()) : [];
  }

  /*
   * Add a record with ID to the cache
   * @param {object} record
   * @param {Map} [index]
   */

  addToCache(record) {
    assert(record, 'addToCache requires record');
    const id = record[this.idProperty];
    assert(id, 'addToCache requires record id');
    const oldRecord = this.getByID(id);
    this.primaryIndex.set(id, record);
    this.updateByOneIndices(record, oldRecord);
  }

  /**
   * Update by-one index data
   * @param {object} record
   * @param {object} [oldRecord]
   * @private
   */

  updateByOneIndices(record, oldRecord) {
    const id = record[this.idProperty];
    this.byOneIndices.forEach((index, column) => {
      // this.addToCache(record, index, column);
      const value = record[column] || null;
      if (oldRecord) {
        const oldValue = oldRecord[column] || null;
        if (value === oldValue) {
          return;
        }
        index.get(oldValue).delete(id);
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
    const record = this.primaryIndex.get(id);
    this.primaryIndex.delete(id);
    this.byOneIndices.forEach((index, column) => {
      const value = record[column] || null;
      index.get(value).delete(id);
    });
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
    this.byOneIndices = new Map();
    this.primaryIndex = this.defineIndex([this.idProperty]);
    this.toOneColumns()
      .forEach(column => {
        this.byOneIndices.set(column, this.defineIndex([column]));
      });
  }

}
