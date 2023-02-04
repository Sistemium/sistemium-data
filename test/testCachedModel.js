import { expect } from 'chai';
import CachedModel, { CACHE_RESPONSE_OPTION } from '../src/CachedModel';
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

  it('should do cached fetches', async function () {

    const all = await Person.fetchOnce({});
    expect(all).to.be.instanceOf(Array);
    const props = { id: 'newPerson' };
    const newPerson = await Person.create(props);
    expect(newPerson).to.eql(props);
    const noFetch = await Person.fetchOnce({}, { once: true });
    expect(noFetch.length).equals(0);
    const nextFetch = await Person.fetchOnce({});
    expect(nextFetch.length).equals(1);

  });

  it('should find my many ids', async function () {

    const ids = ['john-smith-id', 'non-existing-id'];

    await Person.findByID(ids[0]);
    const data = await Person.findByMany(ids, { cached: true });
    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(0);

  });

  it('should not cache after findAll with option', async function () {

    const found = await Person.findAll({}, { [CACHE_RESPONSE_OPTION]: false });
    const filtered = Person.filter({});
    expect(found.length).to.be.above(0);
    expect(filtered.length).to.eql(0);

  });

  it('should cache after create', async function () {

    const id = 'test';
    await Person.create({ id });
    const [filtered] = Person.filter({ id });
    expect(filtered.id).equals(id);

  });

  it('should eject after destroy', async function () {

    const id = 'test';
    const fatherId = 'anotherFatherId';
    await Person.create({ id, fatherId });
    await Person.destroy(id);
    const filtered = Person.filter({ id });
    expect(filtered).to.eql([]);
    expect(Person.getManyByIndex('fatherId', fatherId)).to.eql([]);

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

  it('should update indexes after create', function () {

    const [person] = people;
    const { fatherId } = person;

    Person.addManyToCache(people);
    const updatedPerson = { ...person, name: 'newName' };
    Person.addToCache(updatedPerson);
    const [reIndexed] = Person.getManyByIndex('fatherId', fatherId);
    expect(reIndexed.name).to.not.equals(person.name);

  });

});
