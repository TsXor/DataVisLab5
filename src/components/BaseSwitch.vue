<script setup lang="tsx">
/**
 * 基本的选择性渲染部件，实际使用时需要扩展。
 * `model`值为`default`槽中被选中元素的下标，无已选中元素时值为`-1`。
 */

import { type VNode } from 'vue';
import { clsx } from "@nberlette/clsx";
import { expandFragments } from './utils';

let choice = $(defineModel({ type: Number, default: -1, }));

const slots = defineSlots<{
  /** 要选择性展示的元素 */
  default?: () => VNode[],
  /** 需要将每个default槽中的元素转化为选项元素 */
  choice: (scope: { index: number, vnode: VNode, chosen: boolean }) => VNode[],
  /** 需要将default槽中被选中的元素转化成实际显示的元素 */
  item: (scope: { vnode: VNode }) => VNode[],
}>();

function onClickIndex(index: number) {
  if (choice === index) { choice = -1; }
  else { choice = index; }
}

defineRender(() => {
  const itemFragments = slots.default === undefined ? [] : slots.default();
  const itemNodes = expandFragments(itemFragments);
  return <div>
    <div class="choice-list">
      { itemNodes.map((vnode, index) => {
        const chosen = index == choice;
        return <div class={clsx('choice-item', {chosen: chosen})} onClick={() => onClickIndex(index)}>
          { slots.choice({index: index, vnode: vnode, chosen: chosen}) }
        </div>;
      }) }
    </div>
    <div class="shown-item">
      { choice === -1 ? null : slots.item({vnode: itemNodes[choice]}) }
    </div>
  </div>;
});
</script>
