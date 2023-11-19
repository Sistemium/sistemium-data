import ModelPlugin from '../ModelPlugin';
import { v4 } from 'uuid';
import Model from '../Model';

export default class CommonFieldsPlugin extends ModelPlugin {

  setup(instance: Model) {
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
  }

}
