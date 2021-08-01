import axios from 'axios';
import coreSettle from 'axios/lib/core/settle';

export default axios.create();

export function axiosInstance(config = {}) {
  return axios.create(config);
}

export const settle = coreSettle;
