import { assert, expect } from 'chai';
import mongoose from 'mongoose';
import Model from '../src/Model';
import MongoStoreAdapter from '../src/MongoStoreAdapter';
import { MockMongoose } from 'mock-mongoose';
import personData from './personData';

const mockMongoose = new MockMongoose(mongoose);
const storeAdapter = new MongoStoreAdapter({ mongoose: mockMongoose });

class MongoModel extends Model {
}

if (!MongoModel.setStoreAdapter) {
  Object.assign(MongoModel, Model);
}

MongoModel.setStoreAdapter(storeAdapter);

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
    await mongoose.connect('mongodb://mongo.sistemium.net/TestingDB', {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
  })

  it('should store data', async function () {

    const props = personData[0];

    const { data: created } = await Person.createOne(props);
    // console.log('created', created);
    expect(created).to.deep.include(props);

    await Person.createOne(personData[1]);

    const { data: found } = await Person.findOne(props.id);
    // console.log('found', found);
    expect(found.toObject(), 'found object is not equal to created').to.eql(created.toObject());

    const { data: foundArray } = await Person.find({ id: props.id });
    expect(foundArray.map(item => item.toObject())).to.eql([created.toObject()]);

  });

  it('should merge data', async function () {

    await mockMongoose.helper.reset();

    const { data: ids } = await Person.merge(personData);
    // console.log('ids', ids);
    expect(ids).to.be.eql(personData.map(({ id }) => id));

  });

});
