import { assert, expect } from 'chai';
import mongoose from 'mongoose';
import Model from '../src/Model';
import MongoStoreAdapter from '../src/MongoStoreAdapter';
import { MockMongoose } from 'mock-mongoose';

const mockMongoose = new MockMongoose(mongoose);
const storeAdapter = new MongoStoreAdapter({ mongoose: mockMongoose });

Model.setStoreAdapter(storeAdapter);

const Person = new Model({
  collection: 'Person',
  schema: {
    name: String,
  },
});

describe('Mongo Model', function () {

  before(async function () {
    await mockMongoose.prepareStorage();
    await mongoose.connect('mongodb://sistemium.net/TestingDB', {
      // useNewUrlParser: true,
      // useCreateIndex: true,
      useUnifiedTopology: true,
    });
  })

  it('should store data', async function () {

    const { data } = await Person.createOne({ name: 'John Smith' });

    console.log('created', data);

    assert.isObject(data);

  });

});
