type IterYield<T> = T extends Iterable<infer Yield> ? Yield : never;
type IterReturn<T> = T extends Iterable<any, infer Return> ? Return : never;
type IterNext<T> = T extends Iterable<any, any, infer Next> ? Next : never;

export function zip<Args extends Iterable<any>[]>(...args: [...Args]) {
  type IterYields<Ts> = Ts extends [infer T, ...infer Left] ? [IterYield<T>, ...IterYields<Left>] : [];
  type IterReturns<Ts> = Ts extends [infer T, ...infer Left] ? [IterReturn<T> | undefined, ...IterReturns<Left>] : [];
  type IterNexts<Ts> = Ts extends [infer T, ...infer Left] ? [IterNext<T> | undefined, ...IterNexts<Left>] : [];
  type Yield = IterYields<Args>;
  type Return = IterReturns<Args>;
  type Next = IterNexts<Args>;
  return {
    [Symbol.iterator]() {
      const iterators = args.map(arg => arg[Symbol.iterator]());
      return {
        [Symbol.iterator]() { return this; },
        next(...[value]: [] | [Next]) {
          value = value ?? [] as Next;
          const results = iterators.map((iterator, i) => i in value ? iterator.next(value[i]) : iterator.next());
          const done = results.some(result => result.done);
          const resval = results.map(result => result.value);
          if (done) results.forEach((result, i) => {
            if (!result.done) {
              resval[i] = undefined;
              if (iterators[i].return) iterators[i].return();
            }
          });
          return { done, value: resval } as IteratorResult<Yield, Return>;
        },
        return(value?: Return) {
          value = value ?? [] as Return;
          const results = { done: true, value: [] as any[] };
          iterators.forEach((iterator, i) => {
            const result = iterator.return ? (i in value ? iterator.return(value[i]) : iterator.return()) : undefined;
            results.value.push(result?.done ? result.value : undefined);
          });
          return results as IteratorResult<Yield, Return>;
        },
        throw(e?: any) {
          const results = { done: true, value: [] as any[] };
          iterators.forEach((iterator, i) => {
            const result = iterator.throw ? iterator.throw(e) : undefined;
            results.value.push(result?.done ? result.value : undefined);
          });
          return results as IteratorResult<Yield, Return>;
        }
      };
    }
  };
}

export function enumerate<T extends Iterable<any>>(iterable: T) {
  const increment = {
    [Symbol.iterator]() {
      return {
        [Symbol.iterator]() { return this; },
        _value: 0,
        next() { return { done: false, value: this._value++ }; }
      };
    }
  };
  return zip(increment, iterable);
}

export type Result<Success, Failure> = {
  success: true;
  data: Success;
} | {
  success: false;
  failure: Failure;
};

export function asSuccess<Success, Failure>(result: Result<Success, Failure>) {
  return (result as { success: true; data: Success }).data;
}

export function asFailure<Success, Failure>(result: Result<Success, Failure>) {
  return (result as { success: false; failure: Failure }).failure;
}

export function testJSON(text: string) {
  try { JSON.parse(text); return true; }
  catch (error) { return false; }
}

export type ObjectPath = (number | string)[];
export type ObjectChange = { path: ObjectPath, value: any };

export function patchObject(obj: any, path: ObjectPath, value: any) {
  if (path.length === 0) return;
  const last = path[path.length - 1];
  for (let i = 0; i < path.length - 1; ++i) { obj = obj[path[i]]; }
  obj[last] = value;
}
