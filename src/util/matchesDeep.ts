import isObject from 'lodash/isObject'
import findIndex from 'lodash/findIndex'
import find from 'lodash/find'

type ObjectValues = string | number | boolean | null

type ObjectOrArray = Record<string, any> | Array<ObjectOrArray> | ObjectValues | undefined

export default function matchesDeep(obj1: ObjectOrArray, obj2: ObjectOrArray): boolean {
  switch (type(obj1)) {
    case 'Object':
      return objectsMatch(
        obj1 as { [key: string]: ObjectOrArray },
        obj2 as { [key: string]: ObjectOrArray }
      )
    case 'Array':
      return arrayMatch(obj1 as ObjectOrArray[], obj2 as ObjectOrArray[])
    default:
      return obj1 === obj2 || (!obj1 && obj2 === null)
  }
}

function arrayMatch(arr1: ObjectOrArray[], arr2: ObjectOrArray[]): boolean {
  if (!arr2) {
    return !arr1.length
  }

  if (!Array.isArray(arr2)) {
    return false
  }

  if (arr1.length !== arr2.length) {
    return false
  }

  const predicate = (elem: ObjectOrArray, idx: number) => !matchesDeep(elem, arr2[idx])

  return findIndex(arr1, predicate) === -1
}

function objectsMatch(
  obj1: { [key: string]: ObjectOrArray },
  obj2: { [key: string]: ObjectOrArray }
): boolean {
  if (obj2 === undefined) {
    return !find(Object.keys(obj1), key => obj1[key] !== undefined)
  }

  if (!isObject(obj2)) {
    return false
  }

  return !find(Object.keys(obj1), key => !matchesDeep(obj1[key], obj2[key]))
}

function type(arg: ObjectOrArray): string {
  if (Array.isArray(arg)) {
    return 'Array'
  }
  if (isObject(arg)) {
    return 'Object'
  }
  return 'Primitive'
}
