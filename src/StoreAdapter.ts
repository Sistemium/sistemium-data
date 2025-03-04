import { IStoreAdapter, ModelConfig } from './Model';

export interface StoreAdapterConfig extends Partial<IStoreAdapter> {
  idProperty?: string
}

export default class StoreAdapter<MT = any> implements IStoreAdapter {

  models: Map<string, MT>
  idProperty: string

  constructor(options: StoreAdapterConfig = {}) {
    const { idProperty = 'id' } = options;
    this.models = new Map();
    Object.assign(this, options);
    this.idProperty = idProperty;
  }

  setupModel(name: string, config: ModelConfig, model: MT) {
    this.models.set(name, model);
  }

  getStoreModel(name: string) {
    const res = this.models.get(name)
    if (!res) {
      throw new Error(`Unknown model name ${name}`)
    }
    return res
  }

  getStoreModelIfExists(name: string) {
    return this.models.get(name)
  }

}
