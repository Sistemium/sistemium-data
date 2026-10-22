import { assert, expect } from 'chai';
import Model from '../src/Model';
import CommonFieldsPlugin from '../src/plugins/CommonFieldsPlugin';

class TestModel extends Model {
}

if (!TestModel.useAxios) {
  Object.assign(TestModel, Model);
}

const Person = new TestModel({
  collection: 'Person',
  schema: {
    name: String,
  },
})

describe('Model defaults', function () {

  it('could use default axios', function () {
    const axios = Person.axios();
    assert(axios);
    TestModel.useAxios();
    expect(axios).equals(Person.axios());
  });

  it('should generate uuid ids with CommonFieldsPlugin', function () {
    const schema: Record<string, any> = {};
    new CommonFieldsPlugin().setup({ schema } as Model);
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const id = schema.id.default({ some: 'document' });
    expect(id).to.match(uuidRe);
    expect(schema.id.default()).not.equals(id);
  });

});
