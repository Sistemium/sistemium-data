import { assert, expect } from 'chai';
import mongoose from 'mongoose';
import Model, { OFFSET_HEADER, SORT_HEADER } from '../src/Model';
import MongoStoreAdapter from '../src/MongoStoreAdapter';
import { MockMongoose } from 'mock-mongoose';
import personData from './personData';
import CommonFieldsPlugin from '../src/plugins/CommonFieldsPlugin';

const mockMongoose = new MockMongoose(mongoose);
const storeAdapter = new MongoStoreAdapter({ mongoose });

class MongoModel extends Model {
}

if (!MongoModel.useStoreAdapter) {
  Object.assign(MongoModel, Model);
}

MongoModel
  .useStoreAdapter(storeAdapter)
  .plugin(new CommonFieldsPlugin());

const Person = new MongoModel({
  collection: 'Person',
  schema: {
    id: String,
    name: String,
  },
});

describe('Mongo Model', function () {

  before(async function () {
    await mockMongoose.prepareStorage();
    await storeAdapter.connect('mongo.sistemium.net/TestingDB');
  });

  beforeEach(async function () {
    await mockMongoose.helper.reset();
  });

  it('should store data', async function () {

    const props = personData[0];

    const created = await Person.createOne(props);
    // console.log('created', created);
    expect(created).to.deep.include(props);

    await Person.createOne(personData[1]);

    const found = await Person.findByID(props.id);
    // console.log('found', found);
    expect(found, 'found object is not equal to created').to.eql(created);

    const foundArray = await Person.find({ id: props.id });
    expect(foundArray).to.eql([created]);

  });

  it('should merge data', async function () {

    const ids = await Person.merge(personData);
    // console.log('ids', ids);
    expect(ids).to.be.eql(personData.map(({ id }) => id));

    await Person.destroy(ids[0]);

  });

  it('should fetch with offset', async function () {

    await Person.merge(personData);
    const data = await Person.fetchAll();
    const { [OFFSET_HEADER]: offset } = data;
    // console.log('data', data);

    expect(offset).to.match(/^2-\d+$/);

  });

});
