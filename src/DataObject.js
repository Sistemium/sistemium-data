export default class DataObject {

  constructor(config = {}) {
    this.config = config;
  }

  static buildRelations(instance) {
    const { schema = {} } = this;
    Object.keys(schema)
      .map(key => key.match(/^(.+)Id$/))
      .filter(match => match && match[1])
      .forEach(relation => {
        Object.defineProperty(instance, relation, {
          get() {

          }
        };
      });
  }


}
