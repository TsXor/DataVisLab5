import { Fragment, type DirectiveBinding, type Ref, type ShallowRef, type VNode, type WritableComputedRef } from 'vue';

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

export function urlId(id: string) {
  return `url(#${id})`;
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

export function scaleOrigin(x: number, y: number, ...args: [x: number, y: number] | [n: number]) {
  let scaleX: number, scaleY: number;
  if (args.length === 1) { const [n] = args; scaleX = n; scaleY = n; }
  else { [scaleX, scaleY] = args; }
  return matrix(scaleX, 0, 0, scaleY, (scaleX - 1) * -x, (scaleY - 1) * -y);
}

export function matrix(a: number, b: number, c: number, d: number, e: number, f: number) {
  return callExpr('matrix', a, b, c, d, e, f);
}

} // export namespace svgu

/**
 * 粗略计算文字所需的宽高，并简单分行。
 * @param lines 输入的文字，按行分隔
 * @param textSize 文字大小
 * @param lineHeight 行高
 * @param widthLimit 宽度能容纳的文字数
 */
export function calcTextbox(lines: string[], textSize: number, lineHeight: number, widthLimit: number) {
  const truncLines = lines.flatMap(line => {
    return Array.from((function* () {
      for (let i = 0; i < line.length; i += widthLimit) yield line.substring(i, i + widthLimit);
    })());
  });
  let actualWidth = 0;
  truncLines.forEach(line => { if (actualWidth < line.length) actualWidth = line.length; });
  const width = actualWidth * textSize;
  const height = truncLines.length * lineHeight;
  return { width, height, truncLines };
}

export type RelyBinding = DirectiveBinding<
  any[],
  never,
  never
>;

/**
 * [自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives)。
 * 没有任何效果，其作用在于让组件依赖某个响应值。
 */
export function vRely(el: Element, binding: RelyBinding): void {}

export type ElRefBinding = DirectiveBinding<
  (el: Element) => any,
  never,
  never
>;

/**
 * [自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives)。
 * 绑定某个元素而非子组件的引用。
 */
export const vElRef = {
  mounted: (el: Element, binding: ElRefBinding) => {
    binding.value(el);
  }
}
