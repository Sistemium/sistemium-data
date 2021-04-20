import lo from 'lodash';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

export default axios;
export const mock = new MockAdapter(axios);

const persons = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Samantha Jones' },
];

mock.onGet(/\/?Person\/.+/)
  .reply(getPerson);

mock.onGet(/\/?Person$/)
  .reply(getPersonArray);

mock.onAny().reply(config => {
  console.log(config);
  return [401, ''];
});

function getPerson(config) {

  // console.log(config);

  const [, id] = config.url.match(/\/(.+)$/);

  const res = lo.find(persons, { id });

  return [res ? 200 : 404, res];

}

function getPersonArray(config) {

  // console.log(config);

  const { params } = config;

  if (Object.keys(params).length) {
    const res = lo.filter(persons, params);
    return [res.length ? 200 : 204, res];
  }

  return [200, persons];

}
