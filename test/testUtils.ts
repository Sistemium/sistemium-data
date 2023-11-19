import { assert } from 'chai';
import matchesDeep from '../src/util/matchesDeep';

describe('Utils', function () {

  it('should not match different objects', function () {
    assert(!matchesDeep({ b: 'c' }, { a: 'c' }));
  });

  it('should match equal objects', function () {
    assert(matchesDeep({ a: ['c'] }, { a: ['c'] }));
  });

  it('should match equal arrays', function () {
    assert(matchesDeep([{ a: ['c'] }], [{ a: ['c'] }]));
    assert(!matchesDeep([{ a: ['c'] }], [{ a: ['b'] }]));
  });

  it('should match equal strings', function () {
    assert(matchesDeep('[{ a: [] }]', '[{ a: [] }]'));
  });


  it('should match nulls', function () {
    assert(matchesDeep({ b: undefined }, {}), 'undefined key matches undefined val');
    assert(!matchesDeep({ b: null }, {}), 'null does not match undefined key');
    assert(!matchesDeep({ b: null }, { a: undefined }));
    assert(!matchesDeep({ b: null }, { b: undefined }));
    assert(matchesDeep({}, { b: 'null' }), 'second arg may have extra keys');
  });

});
