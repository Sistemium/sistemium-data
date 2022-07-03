import axios from 'axios';
import settle from 'axios/lib/core/settle';

export default axios.create();

export function axiosInstance(config = {}) {
  return axios.create(config);
}

export { axios, settle };
