import settle from 'axios/lib/core/settle'

export default class MongoAdapter {

  adapter(config) {
    return new Promise((resolve, reject) => {
      settle(resolve, reject, {});
    });
  }

}
