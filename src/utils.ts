/* eslint @typescript-eslint/no-explicit-any: off */
type Parameters<T extends (...args: any[]) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;
type ReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : any;

export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
): ((...funcArgs: Parameters<T>) => ReturnType<T>) => {
  let memoizedFn = (...args: Parameters<T>): ReturnType<T> => {
    const data = fn(...args);

    memoizedFn = (..._args: Parameters<T>): ReturnType<T> => data;
    return memoizedFn(...args);
  };

  return memoizedFn;
};

export const memoizeAsync = <T extends (...args: any[]) => any>(
  fn: T,
): ((...funcArgs: Parameters<T>) => ReturnType<T>) => {
  let memoizedFn = (...args: Parameters<T>): ReturnType<T> => {
    return fn(...args).then((data: ReturnType<T>) => {
      memoizedFn = (..._args: Parameters<T>): ReturnType<T> => data;
      return memoizedFn(...args);
    });
  };

  return memoizedFn;
};

export const isString = (x: unknown): x is string => {
  return typeof x === "string";
};

export const isNumber = (x: unknown): x is number => {
  return typeof x === "number";
};