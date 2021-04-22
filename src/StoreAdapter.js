export default class StoreAdapter {

  constructor() {
    this.models = new Map();
  }

  setupModel(name, model) {
    this.models.set(name, model);
  }

  getStoreModel(name) {
    return this.models.get(name);
  }

  async requestAdapter(config) {
    throw new Error('Not implemented');
  }

}
