import { assert, expect } from 'chai';
import Model from '../src/Model';
import axios from './mockAxios';

Model.setAxios(axios);

const Person = new Model({
  collection: 'Person',
  schema: {
    name: String,
  },
})

describe('Model CRUD', function () {

  it('should respond array to findAll', async function () {

    const { data } = await Person.findAll();

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(2);

  });

  it('should use findAll filter param', async function () {

    const name = 'John Smith';
    const { data } = await Person.findAll({ name });

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(1);
    expect(data[0].name).equals(name);

  });

  it('should respond object to findOne', async function () {

    const { data } = await Person.findOne('1');

    assert.isObject(data);
    expect(data.id).equals('1');

  });

});
