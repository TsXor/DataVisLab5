import * as d3 from 'd3';
import { readonly, shallowRef, watch, type DirectiveBinding, type ShallowRef } from 'vue';
import { type ReadonlyShallowRef, type WritableRef } from './utils'

export namespace v {

/**
 * 是的，我放弃大部分泛型了。
 * 因为d3的泛型参数中，GElement并没有什么卵用，反正attr之类的也没有类型提示。
 * 而Datum也并不需要了，所以直接undefined。
 */;

export type Consumer<P, R> = (param: P) => R;
export type Config<T> = Consumer<T, any>;

export type Selection<E extends Element = Element> = d3.Selection<E, undefined, null, undefined>;
export type Transition<E extends Element = Element> = d3.Transition<E, undefined, null, undefined>;
export type ZoomBehavior = d3.ZoomBehavior<Element, undefined>;
export type ZoomEvent = d3.D3ZoomEvent<Element, undefined>;
export type ZoomEventListener = (this: Element, event: ZoomEvent) => void;
export type DragBehavior = d3.DragBehavior<Element, undefined, d3.SubjectPosition | undefined>;
export type DragEvent = d3.D3DragEvent<Element, undefined, d3.SubjectPosition | undefined>;
export type DragEventListener = (this: Element, event: DragEvent) => void;

export function select(el: Element) {
  return d3.select<Element, undefined>(el);
}

/**
 * 修饰渲染函数，使其附带过渡。
 * @param renderer 可接受`d3.Transition`的渲染函数
 * @param config 回调，用于配置过渡参数
 * @returns 修饰过的渲染函数
 */
export function withTransition<E extends Element, R>(
  renderer: Consumer<Transition<E>, R>,
  config?: Config<Transition<E>>
): Consumer<Selection<E>, R> {
  config ??= (t => t);
  return selection => {
    const transition = selection.transition(); config(transition);
    return renderer(transition);
  };
}

interface ElementBound {
  el: ShallowRef<Element | null>;
};

export type BindBinding = DirectiveBinding<
  ElementBound | ElementBound[],
  never,
  never
>;

export type RenderBinding = DirectiveBinding<
  (selection: Selection<any>) => any,
  never,
  never
>;

export class Zoom implements ElementBound {
  el: ShallowRef<Element | null>;
  config: ZoomBehavior;

  constructor(options?: Config<ZoomBehavior>) {
    this.el = shallowRef(null);
    this.config = d3.zoom<Element, undefined>();
    if (options) options(this.config);
    watch(this.el, el => { if (el) select(el).call(this.config); }, { immediate: true });
  }

  transform(transform: d3.ZoomTransform, point?: [number, number], transitionOptions?: Config<Transition>): this {
    if (!this.el.value) return this;
    const selection = select(this.el.value);
    if (transitionOptions) {
      const transition = selection.transition();
      transitionOptions(transition);
      transition.call(this.config.transform, transform, point);
    } else {
      selection.call(this.config.transform, transform, point);
    }
    return this;
  }

  on(typenames: string): ZoomEventListener | undefined;
  on(typenames: string, listener: null): this;
  on(typenames: string, listener: ZoomEventListener): this;
  on(...args: any[]): any {
    let ret = this.config.on.apply(this.config, args as any);
    return ret === this.config ? this : ret;
  }

  useTransformState(name?: string): ReadonlyShallowRef<d3.ZoomTransform> {
    name ??= '_state';
    const transformState = shallowRef<d3.ZoomTransform>(d3.zoomIdentity);
    this.on(`zoom.${name}`, event => transformState.value = event.transform);
    watch(this.el, el => { transformState.value = el ? d3.zoomTransform(el) : d3.zoomIdentity; });
    return readonly(transformState);
  }
};

type PosRefOptions = { x?: WritableRef<number>, y?: WritableRef<number> };

export class Drag implements ElementBound {
  el: ShallowRef<Element | null>;
  config: DragBehavior;

  constructor(options?: Config<DragBehavior>) {
    this.el = shallowRef(null);
    this.config = d3.drag<Element, undefined>();
    if (options) options(this.config);
    watch(this.el, el => { if (el) select(el).call(this.config); }, { immediate: true });
  }

  on(typenames: string): DragEventListener | undefined;
  on(typenames: string, listener: null): this;
  on(typenames: string, listener: DragEventListener): this;
  on(...args: any[]): any {
    let ret = this.config.on.apply(this.config, args as any);
    return ret === this.config ? this : ret;
  }

  attachPos(pos: PosRefOptions): this;
  attachPos(name: string, pos: PosRefOptions): this;
  attachPos(...args: [PosRefOptions] | [string, PosRefOptions]): this {
    let [name, pos] = args.length === 2 ? args : ['_pos', ...args];
    this.on(`drag.${name}`, event => {
      if (pos.x) pos.x.value += event.dx;
      if (pos.y) pos.y.value += event.dy;
    });
    return this;
  }
};

} // export namespace v

/**
 * [自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives)。
 * 将输入的`d3`交互对象作用于指定元素上。 
 */
export function vD3Bind(el: Element, binding: v.BindBinding): void {
  const receivers = binding.value instanceof Array ? binding.value : [binding.value];
  receivers.map(receiver => receiver.el.value = el);
}

/**
 * [自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives)。
 * 将输入的`d3`渲染函数作用于指定元素上。
 */
export function vD3Render(el: Element, binding: v.RenderBinding): void {
  const renderer = binding.value;
  renderer(d3.select(el));
}
