import { assert, expect } from 'chai';
import Model from '../src/Model';

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

});
