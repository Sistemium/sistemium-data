import isObject from 'lodash/isObject';
import find from 'lodash/find';

const GREATER_THAN = '$gt';
const GREATER_THAN_OR_EQUAL = '$gte';
const LESS_THAN = '$lt';
const LESS_THAN_OR_EQUAL = '$lte';

/**
 *
 * @param {object} filter
 * @returns {function(*): boolean}
 */

export default function(filter) {
  const filterKeys = Object.keys(filter);
  if (filterKeys.length === 1) {
    const [field] = filterKeys;
    return mongoMatcher(filter[field], field);
  }
  return arrayMatcher(filterKeys.map(field => mongoMatcher(filter[field], field)));
}

function mongoMatcher(predicate, field) {
  if (Array.isArray(predicate)) {
    throw new Error(`Array predicates unsupported for field "${field}"`);
  }
  if (!isObject(predicate)) {
    return obj => obj[field] === predicate;
  }
  const predicateKeys = Object.keys(predicate);
  if (predicateKeys.length === 1) {
    const [operator] = predicateKeys;
    return mongoPredicate(predicate[operator], field, operator);
  }
  return arrayMatcher(predicateKeys.map(operator => mongoPredicate(predicate[operator], field, operator)));
}

function mongoPredicate(value, field, operator) {

  switch (operator) {
    case GREATER_THAN:
      return obj => obj[field] > value;
    case GREATER_THAN_OR_EQUAL:
      return obj => obj[field] >= value;
    case LESS_THAN:
      return obj => obj[field] < value;
    case LESS_THAN_OR_EQUAL:
      return obj => obj[field] <= value;
    default:
      throw new Error(`Unknown operator ${operator} for field ${field}`);
  }

}

function arrayMatcher(predicates) {
  return obj => !find(predicates, predicate => !predicate(obj));
}
