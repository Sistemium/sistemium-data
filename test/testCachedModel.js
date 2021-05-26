import { expect } from 'chai';
import CachedModel from '../src/CachedModel';
import mockAxios from './mockAxios';
import personData from './personData';

const people = personData();

class TestModel extends CachedModel {
}

TestModel.useAxios(mockAxios());

const Person = new TestModel({
  collection: 'Person',
  schema: {
    name: String,
    fatherId: String,
  },
})

describe('Cached Model', function () {

  beforeEach(function () {
    Person.clearCache();
  });

  it('should get by id after addToCache', function () {

    const [person] = people;
    Person.addToCache(person);
    expect(Person.getByID(person.id)).to.eql(person);

  });

  it('should not get by id after eject', function () {

    const [person] = people;
    const { id } = person;
    Person.addToCache(person);
    Person.eject(id);
    expect(Person.getByID(id)).to.be.undefined;

  });

  it('should filter', function () {

    const person = people[0];
    Person.addManyToCache(people);
    const filtered = Person.filter({ name: person.name });
    expect(filtered).to.eql([person]);
    expect(Person.filter({ a: 1 })).to.eql([]);
    const filteredByFn = Person.filter(({ name }) => name === person.name);
    expect(filteredByFn).to.eql([person]);

  });

  it('should cache after findAll', async function () {

    await Person.findAll();
    const filtered = Person.filter({});
    expect(filtered.length).to.be.above(0);

  });

  it('should cache after create', async function () {

    const id = 'test';
    await Person.create({ id });
    const [filtered] = Person.filter({ id });
    expect(filtered.id).equals(id);

  });

  it('should eject after destroy', async function () {

    const id = 'test';
    await Person.create({ id });
    await Person.destroy(id);
    const filtered = Person.filter({ id });
    expect(filtered).to.eql([]);

  });

  it('should getManyByIndex', function () {

    const [person] = people;
    const { fatherId } = person;

    Person.addManyToCache(people);
    const indexed = Person.getManyByIndex('fatherId', fatherId);
    expect(indexed).to.eql([person]);

    const newFatherId = `${fatherId}-new`;
    const updatedPerson = { ...person, fatherId: newFatherId };
    Person.addToCache(updatedPerson);
    const reIndexed = Person.getManyByIndex('fatherId', fatherId);
    expect(reIndexed).to.eql([]);
    const newIndexed = Person.getManyByIndex('fatherId', newFatherId);
    expect(newIndexed).to.eql([updatedPerson]);

  });

});
