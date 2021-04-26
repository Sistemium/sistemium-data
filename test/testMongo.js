import { assert, expect } from 'chai';
import mongoose from 'mongoose';
import Model from '../src/Model';
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
  })

  it('should store data', async function () {

    const props = personData[0];

    const created = await Person.createOne(props);
    // console.log('created', created);
    expect(created).to.deep.include(props);

    await Person.createOne(personData[1]);

    const found = await Person.findByID(props.id);
    // console.log('found', found);
    expect(found.toObject(), 'found object is not equal to created').to.eql(created.toObject());

    const foundArray = await Person.find({ id: props.id });
    expect(foundArray.map(item => item.toObject())).to.eql([created.toObject()]);

  });

  it('should merge data', async function () {

    await mockMongoose.helper.reset();

    const ids = await Person.merge(personData);
    // console.log('ids', ids);
    expect(ids).to.be.eql(personData.map(({ id }) => id));

    await Person.destroy(ids[0]);

  });

});
