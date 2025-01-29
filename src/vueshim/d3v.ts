import d3 from 'd3';
import { readonly, ref, watch } from 'vue';
import { type ReadonlyNullableRef, computeNullableRef } from './utils'

export namespace d3v {

/**
 * 是`d3.Selection`的别名，但指定了默认类型参数。
 */
export type Selection<
  GElement extends d3.BaseType, Datum = unknown,
  PElement extends d3.BaseType = any, PDatum = unknown
> = d3.Selection<GElement, Datum, PElement, PDatum>;

/**
 * 将元素引用转换成D3选择的引用
 * @param nodeRef 元素的引用，可以来自于`useTemplateRef`
 * @returns D3选择的引用
 */
export function selectRef<GElement extends d3.BaseType, OldDatum>(
  nodeRef: ReadonlyNullableRef<GElement>
) { return computeNullableRef(nodeRef, node => d3.select<GElement, OldDatum>(node)); }

export type ZoomConfigOptions = {
  scaleExtent?: [number, number];
};

export type ZoomTransformOptions = {
  point?: [number, number];
  transition?: {
    duration?: number;
    delay?: number;
  };
};

export type ZoomEventListener<ZoomRefElement extends d3.ZoomedElementBaseType, Datum> =
  (this: ZoomRefElement, event: d3.D3ZoomEvent<ZoomRefElement, Datum>, d: Datum) => void;

export class Zoom<ZoomRefElement extends d3.ZoomedElementBaseType, Datum> {
  selection: ReadonlyNullableRef<Selection<ZoomRefElement, Datum>>;
  config: d3.ZoomBehavior<ZoomRefElement, Datum>;

  /**
   * 我要用靴子狠狠踢D3的鼙鼓！
   * @param selection 选中元素的引用
   * @param options 创建设置
   */
  constructor(selection: ReadonlyNullableRef<Selection<ZoomRefElement, Datum>>, options?: ZoomConfigOptions) {
    this.selection = selection;
    this.config = d3.zoom<ZoomRefElement, Datum>();
    if (options) this.update(options);
    watch(this.selection, selection => selection?.call(this.config), { immediate: true });
  }

  update(options: ZoomConfigOptions): this {
    if (options.scaleExtent) this.config.scaleExtent(options.scaleExtent);
    return this;
  }

  transform(transform: d3.ZoomTransform, options?: ZoomTransformOptions): this {
    if (!this.selection.value) return this;
    options = options || {};
    if (options.transition) {
      let transition = this.selection.value.transition();
      if (options.transition.duration)
        transition.duration(options.transition.duration);
      if (options.transition.delay)
        transition.duration(options.transition.delay);
      transition.call(this.config.transform, transform, options.point);
    } else {
      this.selection.value.call(this.config.transform, transform, options.point);
    }
    return this;
  }

  on(typenames: string): ZoomEventListener<ZoomRefElement, Datum> | undefined;
  on(typenames: string, listener: null): this;
  on(typenames: string, listener: ZoomEventListener<ZoomRefElement, Datum>): this;
  on(...args: any[]): any {
    let ret = this.config.on.apply(this.config, args as any);
    return ret === this.config ? this : ret;
  }
};

/**
 * 监听zoom事件，获取缩放变换状态
 * @param zoom `d3v.Zoom`对象
 * @param name 监听器的名称，不能重复
 * @returns 当前缩放变换状态的引用
 */
export function useZoomTransform<ZoomRefElement extends d3.ZoomedElementBaseType, Datum>(
  zoom: Zoom<ZoomRefElement, Datum>, name: string = '_state'
): ReadonlyNullableRef<d3.ZoomTransform> {
  const transformState = ref<d3.ZoomTransform | null>(null);
  zoom.on(`zoom.${name}`, event => transformState.value = event.transform);
  watch(zoom.selection, selection => {
    transformState.value = selection ? d3.zoomTransform(selection.node()!) : null;
  });
  return readonly(transformState);
}

} // export namespace d3v
