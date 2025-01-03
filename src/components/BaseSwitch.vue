<!--
此文件实现了一个基本的选择性渲染部件，实际使用时需要扩展。
此部件暴露一个model，其值为default槽中被选中元素的下标，无已选中元素时值为-1。
此部件的choice槽需要将每个default槽中的元素转化为选项元素，item槽需要将default槽中被选中的元素转化成实际显示的元素。
-->

<script lang="tsx">
import { computed, defineComponent, type SlotsType, type VNode } from 'vue';
import { expandFragments } from './utils';

export default defineComponent({
  props: {
    modelValue: { type: Number, default: -1, }
  },

  slots: Object as SlotsType<{
    default?: {}
    choice: { index: number, vnode: VNode, chosen: boolean },
    item: { vnode: VNode, },
  }>,

  setup(props, { emit, slots }) {

    const choice = computed({ 
      get: () => props.modelValue, 
      set: (value: number) => emit('update:modelValue', value),
    });

    function onClickIndex(index: number) {
      if (choice.value === index) { choice.value = -1; }
      else { choice.value = index; }
    }

    return () => {
      const itemFragments = slots.default === undefined ? [] : slots.default();
      const itemNodes = expandFragments(itemFragments);
      return <div>
        <div class="choice-list">
          { itemNodes.map((vnode, index) => 
            <div onClick={ () => onClickIndex(index) }>
              { slots.choice({index: index, vnode: vnode, chosen: index == choice.value}) }
            </div>
          ) }
        </div>
        <div class="shown-item">
          { choice.value === -1 ? null :
          slots.item({vnode: itemNodes[choice.value]}) }
        </div>
      </div>;
    }
  }
})
</script>
