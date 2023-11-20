import { expect } from 'chai';
import StoreAdapter from '../src/StoreAdapter';
import Model, { FULL_RESPONSE_OPTION, ModelRequestConfig, OP } from '../src/Model';
import { settle } from '../src/util/axios';

class TestModel extends Model {
}

const storeAdapter = new StoreAdapter({
  requestAdapter(config: ModelRequestConfig) {
    return new Promise((resolve, reject) => {
      settle(resolve, reject, {
        data: config.data,
        status: 200,
        headers: {
          op: config.op,
        },
        statusText: 'OK',
        config,
      })
    })
  },
  transformRequest(data: any) {
    return data
  },
  transformResponse(data: any) {
    return data
  }
})

TestModel.useStoreAdapter(storeAdapter)

const Test = new TestModel({ collection: 'test', schema: {} })

describe('Store adapter', function () {

  it('should use StoreAdapter', async function () {
    const created = await Test.create({ id: 1 })
    expect(created.id).equals(1)
  });

  it('should aggregate', async function () {
    const { headers } = await Test.aggregate([{}], { [FULL_RESPONSE_OPTION ]: true });
    expect(headers.op).equals(OP.AGGREGATE)
  });

  it('should merge', async function () {
    const { headers } = await Test.merge([{}], { [FULL_RESPONSE_OPTION ]: true });
    expect(headers.op).equals(OP.MERGE)
  });

  it('should store models', function () {
    const model = storeAdapter.getStoreModel('test');
    expect(model?.collection).equals('test');
  });

  it('should allow create adapter without config', function () {
    const adapter = new StoreAdapter()
    expect(adapter.idProperty).equals('id');
  });

});
