import { assert, expect } from 'chai';
import CachedModel from '../src/CachedModel';
import mockAxios from './mockAxios';
import personData from './personData';

class TestModel extends CachedModel {
}

TestModel.useAxios(mockAxios());

const Person = new TestModel({
  collection: 'Person',
  schema: {
    name: String,
  },
})

describe('Cached Model', function () {

  beforeEach(function () {
    Person.clearCache();
  });

  it('should get by id after addToCache', function () {

    const person = personData[0];
    Person.addToCache(person);
    expect(Person.getByID(person.id)).to.eql(person);

  });

  it('should not get by id after eject', function () {

    const person = personData[0];
    const { id } = person;
    Person.addToCache(person);
    Person.eject(id);
    expect(Person.getByID(id)).to.be.undefined;

  });

  it('should filter', function () {

    const person = personData[0];
    Person.addManyToCache(personData);
    const filtered = Person.filter({ name: person.name });
    expect(filtered).to.eql([personData[0]]);
    expect(Person.filter({ a: 1 })).to.eql([]);

  });

  it('should cache after findAll', async function () {

    await Person.findAll();
    const filtered = Person.filter({});
    expect(filtered.length).to.be.above(0);

  });

});
