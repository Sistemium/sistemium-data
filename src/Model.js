import axios from './axios';
import isString from 'lodash/isString';

export default class Model {

  static setAxios(axios) {
    this.customAxios = axios;
  }

  static setAdapter(axiosAdapter) {
    const axiosInstance = this.customAxios || axios;
    axiosInstance.adapter = axiosAdapter;
  }

  static setBaseURL(url) {
    this.staticBaseURL = url;
  }

  baseUrl() {
    return this.constructor.staticBaseURL;
  }

  axios() {
    return this.constructor.customAxios || axios;
  }

  requestConfig(config = {}) {
    return {
      baseURL: this.baseUrl(),
      ...config,
    };
  }

  constructor(config) {
    const {
      collection,
      schema,
    } = config;
    this.schema = schema;
    this.collection = collection;
  }

  async findAll(filter = {}, options = {}) {
    return this.axios()
      .get(this.collection, this.requestConfig({
        params: filter,
      }));
  }

  async findOne(id, options = {}) {

    if (!id) {
      throw new Error('findOne requires id');
    }

    if (!isString(id)) {
      throw new Error('findOne requires String id');
    }

    const url = `${this.collection}/${id}`;

    return this.axios()
      .get(url, this.requestConfig());

  }

}
