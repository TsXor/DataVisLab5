import * as d3 from 'd3';
import { shallowRef, type DirectiveBinding } from 'vue';
import type { Arrayable } from '@vueuse/core';

export namespace d3ovr {

export interface DragBehavior<GElement extends d3.DraggedElementBaseType, Datum, Subject> extends d3.DragBehavior<GElement, Datum, Subject> {
  on(typenames: string): ((this: GElement, event: d3.D3DragEvent<GElement, Datum, Subject>, d: Datum) => void) | undefined;
  on(typenames: string, listener: null): this;
  on(typenames: string, listener: (this: GElement, event: d3.D3DragEvent<GElement, Datum, Subject>, d: Datum) => void): this;
};
export const drag = d3.drag as {
  <GElement extends d3.DraggedElementBaseType, Datum>(): DragBehavior<GElement, Datum, Datum | d3.SubjectPosition>;
  <GElement extends d3.DraggedElementBaseType, Datum, Subject>(): DragBehavior<GElement, Datum, Subject>;
};

export interface ZoomBehavior<ZoomRefElement extends d3.ZoomedElementBaseType, Datum> extends d3.ZoomBehavior<ZoomRefElement, Datum> {
  on(typenames: string): ((this: ZoomRefElement, event: d3.D3ZoomEvent<ZoomRefElement, Datum>, d: Datum) => void) | undefined;
  on(typenames: string, listener: null): this;
  on(typenames: string, listener: (this: ZoomRefElement, event: d3.D3ZoomEvent<ZoomRefElement, Datum>, d: Datum) => void): this;
};
export const zoom = d3.zoom as {
  <ZoomRefElement extends d3.ZoomedElementBaseType, Datum>(): ZoomBehavior<ZoomRefElement, Datum>;
};

} // export namespace d3ovr

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

export type ApplyBinding = DirectiveBinding<
  Arrayable<(selection: Selection<any>) => any>,
  never,
  never
>;

export type RaiseBinding = DirectiveBinding<
  boolean,
  never,
  never
>;

} // export namespace v

/**
 * [自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives)。
 * 将输入的`d3`行为配置作用于指定元素上。
 */
export const vD3Apply = {
  mounted: (el: Element, binding: v.ApplyBinding) => {
    const fns = binding.value instanceof Array ? binding.value : [binding.value];
    fns.forEach(fn => fn(d3.select(el)));
  }
}

/**
 * [自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives)。
 * 将输入的`d3`渲染函数作用于指定元素上。
 * 
 * 目前它是`v-d3-apply`的别名，这样做是为了可读性。
 */
export const vD3Render = vD3Apply;

/**
 * [自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives)。
 * 当输入的布尔值为真时，将指定元素重新插入。
 */
export function vD3Raise(el: Element, binding: v.RaiseBinding): void {
  if (binding.value) d3.select(el).raise();
}

export namespace d3u {

export function zoomController<ZoomRefElement extends d3.ZoomedElementBaseType, Datum>(
  behavior: d3ovr.ZoomBehavior<ZoomRefElement, Datum>
) {
  type Selection = d3.Selection<ZoomRefElement, Datum, null, undefined>;
  type Transition = d3.Transition<ZoomRefElement, Datum, null, undefined>;

  const controller = {
    behavior,
    selection: null as Selection | null,
    state: shallowRef(d3.zoomIdentity),

    transform: function (
      newState: d3.ZoomTransform, point?: [number, number],
      transitionOptions?: (t: Transition) => any
    ) {
      if (!this.selection) return;
      if (transitionOptions) {
        const transition = this.selection.transition();
        transitionOptions(transition);
        transition.call(this.behavior.transform, newState, point);
      } else {
        this.selection.call(this.behavior.transform, newState, point);
      }
    }
  };

  const eventName = '__update_state__';
  const propName = '__zoom_state__';
  if (!behavior.on(`zoom.${eventName}`)) {
    behavior.on(`zoom.${eventName}`, function(event) {
      const state = v.select(this).property(propName) as
        typeof controller.state | undefined;
      if (state) state.value = event.transform;
    });
  }

  const apply = (selection: Selection) => {
    const self = apply as typeof apply & typeof controller;
    self.selection = selection
      .property(propName, controller.state)
      .call(behavior);
    self.state.value = d3.zoomTransform(selection.node()!);
  };
  return Object.assign(apply, controller);
}

export function rangeGradientX(id: string, range: string[]) {
  return (selection: v.Selection<SVGDefsElement>) => {
    const gradient = selection.append('linearGradient')
      .attr("id", id)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', range[0]);
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', range[1]);
  }
}

export function rampGradientX(id: string, interpolator: (n: number) => string, stops: number) {
  return (selection: v.Selection<SVGDefsElement>) => {
    const gradient = selection.append('linearGradient')
      .attr("id", id)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    d3.range(0, stops).forEach(i => {
      const t = i / (stops - 1);
      gradient.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', interpolator(t));
    });
  }
}

export function textLines(lines: string[], textSize: number, lineHeight: number) {
  return (selection: v.Selection<SVGTextElement>) => {
    selection.attr('y', -(lineHeight - textSize) / 2);
    selection.selectChildren().remove();
    lines.forEach(line => {
      selection.append('tspan')
        .attr('x', 0)
        .attr('dy', lineHeight)
        .attr('font-size', `${textSize}px`)
        .text(line);
    });
  };
}

} // export namespace d3u
