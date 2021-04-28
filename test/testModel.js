import { assert, expect } from 'chai';
import Model from '../src/Model';
import mockAxios from './mockAxios';
import personData from './personData';

class TestModel extends Model {
}

if (!TestModel.useAxios) {
  Object.assign(TestModel, Model);
}

TestModel.useAxios(mockAxios());

const Person = new TestModel({
  collection: 'Person',
  schema: {
    name: String,
  },
})

describe('Model CRUD', function () {

  it('should respond array to findAll', async function () {

    const data = await Person.findAll();

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(personData.length);

  });

  it('should create', async function () {

    const props = {
      id: 'test-id',
      name: 'Test Name',
    };

    const created = await Person.createOne(props);

    expect(created).to.eql(props);

  });

  it('should use findAll filter param', async function () {

    const name = 'John Smith';
    const data = await Person.findAll({ name });

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(1);
    expect(data[0].name).equals(name);

  });

  it('should respond object to findOne', async function () {

    const { id } = personData[0];
    const data = await Person.findOne({ id });

    assert.isObject(data);
    expect(data.id).equals(id);

  });

});
