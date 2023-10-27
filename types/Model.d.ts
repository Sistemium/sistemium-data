export const OP_MERGE: "merge";
export const OP_CREATE: "createOne";
export const OP_UPDATE_ONE: "updateOne";
export const OP_FIND_ONE: "findOne";
export const OP_FIND_MANY: "findMany";
export const OP_DELETE_ONE: "deleteOne";
export const OP_AGGREGATE: "aggregate";
export const OFFSET_HEADER: "x-offset";
export const SORT_HEADER: "x-sort";
export const FULL_RESPONSE_OPTION: "o-full-response";
declare class Model {
    /**
     * ID field name
     * @returns {string}
     * @package
     */
    static defaultIdProperty(): string;
    /**
     * Configure with axios instance and setup interceptor
     * @param {import('axios').AxiosInstance} [axios]
     */
    static useAxios(axios?: import('axios').AxiosInstance): void;
    /**
     * Makes responses by default returning data. Returns full response with option.
     * @param {object} response
     * @returns {object|import('axios').AxiosResponse}
     * @package
     */
    static responseInterceptor(response: object): object | import('axios').AxiosResponse;
    static useStoreAdapter(storeAdapter: any): typeof Model;
    /**
     *
     * @param {import('./ModelPlugin.js').default} plugin
     * @param name
     */
    static plugin(plugin: import('./ModelPlugin.js').default, name?: any): void;
    constructor(config: any);
    idProperty: any;
    schema: any;
    collection: any;
    /**
     *
     * @returns {import('axios')}
     */
    axios(): typeof import("axios");
    /**
     *
     * @param {object} config
     * @returns {{model: Model, collection: string}}
     */
    requestConfig(config: object): {
        model: Model;
        collection: string;
    };
    /**
     * Find an array of records with optional filter
     * @param {object} [filter]
     * @param {object} [options]
     * @returns {Promise<object[]>}
     */
    find(filter?: object, options?: object): Promise<object[]>;
    /**
     * Aggregate into an array with pipeline
     * @param {Array} [pipeline]
     * @param {object} [options]
     * @returns {Promise<object[]>}
     */
    aggregate(pipeline?: any[], options?: object): Promise<object[]>;
    /**
     * Create or update an array of records
     * @param {object[]} array
     * @param {object} [options]
     * @returns {Promise<object[]>}
     */
    merge(array: object[], options?: object): Promise<object[]>;
    /**
     * Continuously fetch a large array of records page by page
     * @param {object} [filter]
     * @param {object} [options]
     * @returns {Promise<object[]>}
     */
    fetchAll(filter?: object, options?: object): Promise<object[]>;
    /**
     * Called on each page
     * @callback onPageCallback
     * @param {object[]} data
     * @param {string} offset
     * @returns Promise<void>
     */
    /**
     * Continuously fetch a large array of records page by page
     * @param {onPageCallback} onPage
     * @param {object} [filter]
     * @param {object} [options]
     * @returns {Promise<string>}
     */
    fetchPaged(onPage?: (data: object[], offset: string) => any, filter?: object, options?: object): Promise<string>;
    /**
     * Find one record by id
     * @param {string} resourceId
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    findByID(resourceId: string, options?: object): Promise<object>;
    /**
     * Create one record
     * @param {object} props
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    createOne(props: object, options?: object): Promise<object>;
    /**
     * Update one record
     * @param {object} props
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    updateOne(props: object, options?: object): Promise<object>;
    /**
     * Delete one record by id
     * @param {string} resourceId
     * @param {object} [options]
     * @returns {Promise<*>}
     */
    destroy(resourceId: string, options?: object): Promise<any>;
    /**
     * Alias to createOne
     * @param {object} props
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    create(props: object, options?: object): Promise<object>;
    /**
     * Alias to find
     * @param {object} [filter]
     * @param {object} [options]
     * @returns {Promise<object[]>}
     */
    findAll(filter?: object, options?: object): Promise<object[]>;
    /**
     * Find a record matching the filter
     * @param {object} [filter]
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    findOne(filter?: object, options?: object): Promise<object>;
    /**
     * Delete by id specified with filter object (introduced for mongo compatibility)
     * @param {Object} [filter]
     * @param {Object} [options]
     * @returns {Promise<*>}
     */
    deleteOne(filter?: any, options?: any): Promise<any>;
    /**
     * Perform chunked find with id filter
     * @param {Array<string>}ids
     * @param {Object} options
     * @param {string} [options.field]
     * @param {number} [options.chunkSize]
     * @return {Promise<Array>}
     */
    findByMany(ids: Array<string>, options?: {
        field?: string;
        chunkSize?: number;
    }): Promise<any[]>;
}
declare namespace Model {
    const customAxios: import("axios").AxiosInstance;
    const storeAdapter: any;
    const plugins: any;
}
export default Model;
