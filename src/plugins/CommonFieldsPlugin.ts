import { v4 } from 'uuid';
import Model, { IModelPlugin } from '../Model';

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
        default: v4,
      },
    });
    return instance
  }

}
