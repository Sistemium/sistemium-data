import { assert } from 'chai';
import predicates from '../src/util/predicates';

const OBJ = { a: 'ba', b: 'c' };

describe('Predicate builder', function () {

  it('should test simple values', function () {
    const fieldTest = predicates({ b: 'c' });
    assert(fieldTest(OBJ));
  });

  it('should not test not matching', function () {
    const fieldTest = predicates({ b: 'b' });
    assert(!fieldTest(OBJ));
  });

  it('should test $gt', function () {
    const fieldTest = predicates({ a: { $gt: 'a' }, b: 'c' });
    assert(fieldTest(OBJ));
  });

  it('should test $gte', function () {
    const fieldTest = predicates({ a: { $gte: 'b' } });
    assert(fieldTest(OBJ));
  });

  it('should test $lt', function () {
    const fieldTest = predicates({ a: { $lt: 'c' } });
    assert(fieldTest(OBJ));
  });

  it('should test $lte', function () {
    const fieldTest = predicates({ a: { $lte: 'bac' } });
    assert(fieldTest(OBJ));
  });

  it('should test "between"', function () {
    const fieldTest = predicates({ a: { $gte: 'b', $lt: 'c' } });
    assert(fieldTest(OBJ));
  });

  it('should test "in"', function () {
    const fieldTest = predicates({ a: { $in: ['ba'] } });
    assert(fieldTest(OBJ));
  });

  it('should test "nin"', function () {
    const fieldTest = predicates({ a: { $nin: ['a'] } });
    assert(fieldTest(OBJ));
  });

});
