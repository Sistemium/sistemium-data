export default class StoreAdapter {
    constructor(options?: {});
    models: any;
    idProperty: any;
    setupModel(name: any, model: any): void;
    /**
     *
     * @param {string} name
     * @returns {import('./Model').default}
     */
    getStoreModel(name: string): import('./Model').default;
    requestAdapter(config: any): Promise<any>;
}
