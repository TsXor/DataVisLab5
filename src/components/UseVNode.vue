<script setup lang="tsx">
/**
 * “垫片”部件，其作用就是在模板中渲染一个VNode。
 */

import { type PropType, type VNode } from 'vue';

const { vnode } = defineProps({
    vnode: { type: Object as PropType<VNode>, required: true, }
});

defineRender(() => vnode);
</script>
