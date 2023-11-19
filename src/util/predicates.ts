import isObject from 'lodash/isObject';
import find from 'lodash/find';
import isFunction from 'lodash/isFunction'
import { BaseItem } from '../Model';

export type PredicateFn = (i: BaseItem) => boolean

enum OPERATOR {
  GREATER_THAN = '$gt',
  GREATER_THAN_OR_EQUAL = '$gte',
  LESS_THAN = '$lt',
  LESS_THAN_OR_EQUAL = '$lte',
  IN = '$in',
}

export default function (filter: BaseItem | PredicateFn): PredicateFn {
  if (isFunction(filter)) {
    return filter;
  }
  const filterKeys = Object.keys(filter);
  if (filterKeys.length === 0) {
    return () => true;
  }
  if (filterKeys.length === 1) {
    const [field] = filterKeys;
    return mongoMatcher(filter[field], field);
  }
  return arrayMatcher(filterKeys.map(field => mongoMatcher(filter[field], field)));
}

function mongoMatcher(predicate: BaseItem | BaseItem[], field: string): PredicateFn {
  if (Array.isArray(predicate)) {
    throw new Error(`Array predicates unsupported for field "${field}"`);
  }
  if (!isObject(predicate)) {
    return (obj: BaseItem) => obj[field] === predicate;
  }
  const predicateKeys = Object.keys(predicate);
  if (predicateKeys.length === 1) {
    const [operator] = predicateKeys;
    return mongoPredicate(predicate[operator], field, operator);
  }
  return arrayMatcher(predicateKeys.map(operator => mongoPredicate(predicate[operator], field, operator)));
}

function mongoPredicate(value: any, field: string, operator: OPERATOR | string): PredicateFn {

  switch (operator) {
    case OPERATOR.IN:
      return obj => value.includes(obj[field]);
    case OPERATOR.GREATER_THAN:
      return obj => obj[field] > value;
    case OPERATOR.GREATER_THAN_OR_EQUAL:
      return obj => obj[field] >= value;
    case OPERATOR.LESS_THAN:
      return obj => obj[field] < value;
    case OPERATOR.LESS_THAN_OR_EQUAL:
      return obj => obj[field] <= value;
    default:
      throw new Error(`Unknown operator ${operator} for field ${field}`);
  }

}

function arrayMatcher(predicates: PredicateFn[]): PredicateFn {
  return obj => !find(predicates, predicate => !predicate(obj));
}
