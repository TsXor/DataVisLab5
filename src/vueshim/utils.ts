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
