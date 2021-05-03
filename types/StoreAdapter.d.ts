export default class StoreAdapter {
    constructor(options?: {});
    models: Map<any, any>;
    idProperty: any;
    setupModel(name: any, model: any): void;
    getStoreModel(name: any): any;
    requestAdapter(config: any): Promise<any>;
}
