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
