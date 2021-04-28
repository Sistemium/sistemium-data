import Model from './Model';
import assert from 'sistemium-mongo/lib/assert';
import matches from 'lodash/matches';

export default class CachedModel extends Model {

  constructor(config) {
    super(config);
    this.clearCache();
  }

  static matcher(filter) {
    return matches(filter);
  }

  defineIndex(keys = []) {
    const index = new Map();
    this.indices.set(keys.join('|'), index);
    return index;
  }

  getByID(id) {
    assert(id, 'getByID requires id');
    return this.primaryIndex.get(id);
  }

  addToCache(record) {
    assert(record, 'addToCache requires record');
    const { [this.idProperty]: id } = record;
    assert(id, 'addToCache requires record id');
    this.primaryIndex.set(id, record);
  }

  addManyToCache(records) {
    assert(Array.isArray(records), 'addManyToCache requires array of records');
    records.forEach(record => this.addToCache(record));
  }

  eject(id) {
    assert(id, 'eject requires id');
    this.primaryIndex.delete(id);
  }

  filter(filter = {}) {
    const res = [];
    const isMatch = this.constructor.matcher(filter);
    this.primaryIndex.forEach(record => isMatch(record) && res.push(record));
    return res;
  }

  clearCache() {
    // this.cache = [];
    this.indices = new Map();
    this.primaryIndex = this.defineIndex([this.idProperty]);
  }

}
