export function createDynamicObject<T extends string, U>(
  keys: T[],
  values: U[],
): Record<T, U> {
  const obj: Record<T, U> = {} as Record<T, U>;
  keys.forEach((key, index) => {
    obj[key] = values[index];
  });
  return obj;
}

// const dynamicObj = createDynamicObject(['name', 'age'], ['Bob', 25]);

type SimpleObject = Record<string, string>;

export const areSimpleObjectsEqual = (
  obj1: SimpleObject,
  obj2: SimpleObject,
): boolean => {
  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);

  return obj1Keys.length === obj2Keys.length
    ? obj1Keys.every((key) => obj1[key] === obj2[key])
    : false;
};
