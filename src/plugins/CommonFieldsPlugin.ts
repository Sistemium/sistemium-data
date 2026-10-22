import Model, { IModelPlugin } from '../Model';

/**
 * Global crypto (Node 19+ and browsers), not the node module, so browser bundles still load
 */
function uuidV4() {
  return crypto.randomUUID();
}

export default class CommonFieldsPlugin implements IModelPlugin {

  setup(instance: Model<any>) {
    const { schema } = instance;
    Object.assign(schema, {
      // ts: Date,
      cts: {
        type: Date,
        default: Date.now,
        setOnInsert: true,
      },
      id: {
        type: String,
        default: uuidV4,
      },
    });
    return instance
  }

}
