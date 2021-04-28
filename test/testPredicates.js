import { assert } from 'chai';
import * as predicates from '../src/util/predicates';

const OBJ = { a: 'ba', b: 'c' };

describe('Predicate builder', function () {

  it('should test simple values', function () {
    const fieldTest = predicates.mongoMatcher('c', 'b');
    assert(fieldTest(OBJ));
  });

  it('should test $gt', function () {
    const fieldTest = predicates.mongoMatcher({ $gt: 'a' }, 'a');
    assert(fieldTest(OBJ));
  });

  it('should test $gte', function () {
    const fieldTest = predicates.mongoMatcher({ $gte: 'b' }, 'a');
    assert(fieldTest(OBJ));
  });

  it('should test $lt', function () {
    const fieldTest = predicates.mongoMatcher({ $lt: 'c' }, 'a');
    assert(fieldTest(OBJ));
  });

  it('should test $lte', function () {
    const fieldTest = predicates.mongoMatcher({ $lte: 'bac' }, 'a');
    assert(fieldTest(OBJ));
  });

  it('should test "between"', function () {
    const fieldTest = predicates.mongoMatcher({ $gte: 'b', $lt: 'c' }, 'a');
    assert(fieldTest(OBJ));
  });

});
