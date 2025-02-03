import { Fragment, type Ref, type ShallowRef, type VNode, type WritableComputedRef } from 'vue';

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
export type ReadonlyShallowRef<T> = Readonly<ShallowRef<T>>;

export type WritableRef<T> = Ref<T> | ShallowRef<T> | WritableComputedRef<T>;

export type Point = [number, number];
export type Points = Point[];
export function svgPoints(points: Points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}
