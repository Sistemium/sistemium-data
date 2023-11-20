import Model, { IStoreAdapter } from './Model';

export interface StoreAdapterConfig extends Partial<IStoreAdapter> {
  idProperty?: string
}

export default class StoreAdapter implements IStoreAdapter {

  models: Map<string, Model<any>>
  idProperty: string

  constructor(options: StoreAdapterConfig = {}) {
    const { idProperty = 'id' } = options;
    this.models = new Map();
    Object.assign(this, options);
    this.idProperty = idProperty;
  }

  setupModel(name: string, model: Model<any>) {
    this.models.set(name, model);
  }

  getStoreModel(name: string) {
    return this.models.get(name);
  }

}
