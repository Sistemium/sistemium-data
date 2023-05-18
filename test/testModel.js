import { assert, expect } from './chai';
import Model, { OFFSET_HEADER } from '../src/Model';
import mockAxios, { people, PAGE_SIZE_HEADER } from './mockAxios';

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

  beforeEach(() => {

  });

  it('should respond array to findAll', async function () {

    const data = await Person.findAll();

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(people.length);

  });

  it('should fetch with no offset support', async function () {

    const data = await Person.fetchAll({ emptyResponse: true });

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(0);

  });

  it('should find my many ids', async function () {

    const data = await Person.findByMany(['john-smith-id', 'non-existing-id']);

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(1);

  });

  it('should create', async function () {

    const props = {
      id: 'test-id',
      name: 'Test Name',
    };

    const created = await Person.createOne(props);

    expect(created).to.eql(props);

    const findCreated = await Person.findByID(props.id);
    expect(findCreated).to.include(props);

  });

  it('should patch', async function () {

    const props = {
      id: 'test-id',
      name: 'Patched Test Name',
    };

    const patched = await Person.updateOne(props);
    expect(patched).to.include(props);

    const findPatched = await Person.findByID(props.id);
    expect(findPatched).to.include(props);

  });

  it('should use findAll filter param', async function () {

    const name = 'John Smith';
    const data = await Person.findAll({ name });

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(1);
    expect(data[0].name).equals(name);

  });

  it('should respond object to findOne', async function () {

    const { id } = people[0];
    const data = await Person.findOne({ id });

    assert.isObject(data);
    expect(data.id).equals(id);

    expect(await Person.findOne({ id: null })).to.be.null;

  });

  it('should error to findByID with improper id', async function () {

    await expect(Person.findByID(''))
      .to.be.rejectedWith('findOne requires resourceId');
    await expect(Person.findByID(1))
      .to.be.rejectedWith('findOne requires String resourceId');

  });

  it('should error to destroy with improper id', async function () {

    await expect(Person.destroy(''))
      .to.be.rejectedWith('destroy requires resourceId');
    await expect(Person.destroy(1))
      .to.be.rejectedWith('destroy requires String resourceId');

  });

  it('should fetch by pages', async function () {

    const pageSize = 1;

    const options = { headers: { [PAGE_SIZE_HEADER]: pageSize } };
    const offset = await Person.fetchPaged(async (data, offset) => {
      expect(data).to.be.instanceOf(Array);
      expect(data.length).equals(pageSize);
    }, {}, options);

    expect(offset).equals(people.at(-1)[OFFSET_HEADER]);

    const headers = { [OFFSET_HEADER]: offset };
    const empty = await Person.fetchAll({}, { headers });

    expect(empty).to.eql([]);
    expect(empty[OFFSET_HEADER]).equals(offset);

  });

  it('should fetch all', async function () {

    const pageSize = 1;

    const options = { headers: { [PAGE_SIZE_HEADER]: pageSize } };
    const data = await Person.fetchAll({}, options);

    expect(data).to.be.instanceOf(Array);
    expect(data.length).equals(people.length);
    const { [OFFSET_HEADER]: offset } = data;
    expect(offset).to.be.not.empty;
    expect(offset).equals(people.at(-1)[OFFSET_HEADER]);

  });

});
