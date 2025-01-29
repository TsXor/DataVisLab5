import { Fragment, readonly, ref, toValue, watch, type Ref, type VNode, type WatchSource } from 'vue';

/**
 * Vue的slot函数在某些情况下会返回Fragment，使用此函数展平它们。
 * @param vnodes slot函数返回的VNode数组
 */
export function expandFragments(vnodes: VNode[]) {
  return vnodes.flatMap(frag => {
    if (frag.type === Fragment) { return frag.children as VNode[]; }
    else { return [frag]; }
  });
}

export type Pair<T> = [T, T];

export type ReadonlyRef<T> = Readonly<Ref<T>>;
export type ReadonlyNullableRef<T> = Readonly<Ref<T | null>>;

export function computeRef<T, R>(source: WatchSource<T>, getter: (obj: T) => R) {
  const result = ref(getter(toValue(source)));
  watch(result, obj => result.value = getter(obj));
  return readonly(result);
}

export function computeNullableRef<T, R>(source: WatchSource<T | null>, getter: (obj: T) => R) {
  return computeRef(source, obj => obj === null ? null : getter(obj));
}
