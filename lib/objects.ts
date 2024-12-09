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
