import axios from 'axios';

export default axios.create();

export function axiosInstance(config = {}) {
  return axios.create(config);
}
