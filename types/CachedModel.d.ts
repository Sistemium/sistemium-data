export default class CachedModel extends Model {
    /**
     * Override for custom predicate implementation
     * @param {object} filter
     * @returns {function(*): boolean}
     * @private
     */
    private static matcher;
    /**
     * Override for custom predicate implementation
     * @returns {array}
     * @private
     */
    private toOneColumns;
    /**
     * Create a map index
     * @param {string[]} keys
     * @returns {Map<string, any>}
     */
    defineIndex(keys?: string[]): Map<string, any>;
    /**
     * Get one cached record by id
     * @param {string} id
     * @returns {object}
     */
    getByID(id: string): object;
    /**
     * Get array of indexed records
     * @param {string} column
     * @param {string|number|boolean} value
     * @returns {array}
     */
    getManyByIndex(column: string, value: string | number | boolean): any[];
    addToCache(record: any): void;
    /**
     * Update by-one index data
     * @param {object} record
     * @param {object} [oldRecord]
     * @private
     */
    private updateByOneIndices;
    /**
     * Add an array of records to cache
     * @param {object[]} records
     */
    addManyToCache(records: object[]): void;
    /**
     * Remove from cache by id
     * @param {string} id
     */
    eject(id: string): void;
    /**
     * Get an array of records from cache with optional filter
     * @param {object} [filter]
     * @returns {object[]}
     */
    filter(filter?: object): object[];
    /**
     * Empty caches
     */
    clearCache(): void;
    indices: Map<any, any>;
    byOneIndices: Map<any, any>;
    primaryIndex: Map<string, any>;
}
import Model from "./Model";
