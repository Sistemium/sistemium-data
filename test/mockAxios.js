import lo from 'lodash';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import personData from './personData';

export const people = personData();

export default function () {

  const axiosInstance = axios.create();

  const mock = new MockAdapter(axiosInstance);

  mock.onGet(/\/?Person\/.+/)
    .reply(getPerson);

  mock.onGet(/\/?Person$/)
    .reply(getPersonArray);

  mock.onPost(/\/?Person$/)
    .reply(createPerson);

  mock.onPatch(/\/?Person\/.+/)
    .reply(patchPerson);

  mock.onDelete(/\/?Person\/.+/)
    .reply(deletePerson);

  mock.onAny().reply(config => {
    console.error('mockAxios undefined route', config.method, config.url);
    return [401, ''];
  });

  return axiosInstance;

}

function deletePerson(config) {
  // console.log(config);
  const id = getIdFromUrl(config.url);
  lo.remove(people, { id });
  return [204, ''];
}

function createPerson(config) {
  // console.log(config);
  const { data } = config;
  people.push(JSON.parse(data));
  return [201, data];
}

function patchPerson(config) {
  const id = getIdFromUrl(config.url);
  const { data } = config;
  // console.log(config);
  const idx = lo.findIndex(people, { id });
  if (idx === -1) {
    return [404];
  }
  people.splice(idx, 1, JSON.parse(data));
  return [200, data];
}

function getPerson(config) {

  // console.log(config);

  const id = getIdFromUrl(config.url);
  const res = lo.find(people, { id });
  return [res ? 200 : 404, res];

}

function getPersonArray(config) {

  // console.log(config);

  const { params } = config;

  if (params.emptyResponse) {
    return [204, null];
  }

  if (Object.keys(params).length) {
    const res = lo.filter(people, params);
    return [res.length ? 200 : 204, res];
  }

  return [200, people];

}

function getIdFromUrl(url) {
  const [, id] = url.match(/\/(.+)$/);
  return id;
}
