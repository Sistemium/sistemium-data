import Model from './Model';

export interface StoreAdapterConfig {
  idProperty?: string
}

export default class StoreAdapter<T = Model> {

  models: Map<string, T>
  idProperty: string

  constructor(options: StoreAdapterConfig) {
    const { idProperty = 'id' } = options;
    this.models = new Map();
    this.idProperty = idProperty;
  }

  setupModel(name: string, model: T) {
    this.models.set(name, model);
  }

  getStoreModel(name: string) {
    return this.models.get(name);
  }

}
