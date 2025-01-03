<!--
此文件实现了一个“垫片”部件，其作用就是在模板中渲染一个VNode。
-->

<script lang="tsx">
import { defineComponent, type PropType, type VNode } from 'vue';

export default defineComponent({
  props: {
    vnode: { type: Object as PropType<VNode>, required: true, }
  },

  setup(props) {
    return () => props.vnode;
  }
})
</script>
