import { Fragment, type VNode } from 'vue';

/**
 * Vue的slot函数在某些情况下会返回Fragment，使用此函数展平它们。
 * @param vnodes slot函数返回的VNode数组
 */
export function expandFragments(vnodes: VNode[]) {
  return vnodes.reduce<VNode[]>((res, frag) => {
    if (frag.type === Fragment) { return res.concat(frag.children as VNode[]); }
    else { res.push(frag); return res; }
  }, []);
}
