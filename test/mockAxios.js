import lo from 'lodash';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import persons from './personData';

export default function () {

  const axiosInstance = axios.create();

  const mock = new MockAdapter(axiosInstance);

  mock.onGet(/\/?Person\/.+/)
    .reply(getPerson);

  mock.onGet(/\/?Person$/)
    .reply(getPersonArray);

  mock.onAny().reply(config => {
    console.log(config);
    return [401, ''];
  });

  return axiosInstance;

}

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
