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
    id: String,
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

    const props = { name: 'John Smith', id: 'john-smith-id' };

    const { data: created } = await Person.createOne(props);
    // console.log('created', created);

    expect(created).to.deep.include(props);

    const { data: found } = await Person.findOne(props.id);
    // console.log('found', found);

    expect(found.toObject(), 'found object is not equal to created').to.eql(created.toObject());

  });

});
