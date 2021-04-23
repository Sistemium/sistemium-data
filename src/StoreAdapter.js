export default class StoreAdapter {

  constructor(options = {}) {
    const { idProperty = 'id' } = options;
    this.models = new Map();
    this.idProperty = idProperty;
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
