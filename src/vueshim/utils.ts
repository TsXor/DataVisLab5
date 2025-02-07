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

/**
 * 生成svg中的一些常用字符串。
 * 使用类型检查来降低错误率。
 */
export namespace svgu {

export type Point = [number, number];
export type PointXY = { x: number; y: number };

export function callExpr(name: string, ...args: { toString(): string }[]) {
  return `${name}(${args.map(arg => arg.toString()).join(',')})`;
}

export function points(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

export function viewbox(x: number, y: number, w: number, h: number) {
  return `${x} ${y} ${w} ${h}`;
}

export function translate(x: number, y: number) {
  return callExpr('translate', x, y);
}

export function translateOf(p: Point | PointXY) {
  let x: number, y: number;
  if (p instanceof Array) { [x, y] = p; }
  else { x = p.x; y = p.y; }
  return callExpr('translate', x, y);
}

export function scale(...args: [x: number, y: number] | [n: number]) {
  return callExpr('scale', ...args);
}

export function matrix(a: number, b: number, c: number, d: number, e: number, f: number) {
  return callExpr('matrix', a, b, c, d, e, f);
}

} // export namespace svgu
