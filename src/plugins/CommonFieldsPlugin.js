import ModelPlugin from '../ModelPlugin';

export default class CommonFieldsPlugin extends ModelPlugin {

  setup(instance) {
    const { schema } = instance;
    Object.assign(schema, {
      ts: String,
      cts: Date,
      id: String,
    });
  }

}
