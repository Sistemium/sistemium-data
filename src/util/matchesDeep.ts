import isObject from 'lodash/isObject';
import findIndex from 'lodash/findIndex';
import find from 'lodash/find';

export default function matchesDeep(obj1, obj2) {

  switch (type(obj1)) {
    case 'Object':
      return objectsMatch(obj1, obj2);
    case 'Array':
      return arrayMatch(obj1, obj2);
    default:
      return obj1 === obj2 || (!obj1 && obj2 === null);
  }

}

function arrayMatch(arr1, arr2) {

  if (!arr2) {
    return !arr1.length;
  }

  if (!Array.isArray(arr2)) {
    return false;
  }

  if (arr1.length !== arr2.length) {
    return false;
  }

  return findIndex(arr1, (elem, idx) => !matchesDeep(elem, arr2[idx])) === -1;

}

function objectsMatch(obj1, obj2) {

  if (obj2 === undefined) {
    return !find(Object.keys(obj1), key => obj1[key] !== undefined);
  }

  if (!isObject(obj2)) {
    return false;
  }

  return !find(Object.keys(obj1), key => !matchesDeep(obj1[key], obj2[key]));

}

function type(arg) {
  if (Array.isArray(arg)) {
    return 'Array';
  }
  if (isObject(arg)) {
    return 'Object';
  }
  return 'Primitive';
}
