import ModelPlugin from '../ModelPlugin';
import { v4 } from 'uuid';

export default class CommonFieldsPlugin extends ModelPlugin {

  setup(instance) {
    const { schema } = instance;
    Object.assign(schema, {
      // ts: Date,
      cts: {
        type: Date,
        // default: Date.now,
      },
      id: {
        type: String,
        default: v4,
      },
    });
  }

}
