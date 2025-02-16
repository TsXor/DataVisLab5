<script setup lang="ts">
import { useSelectionStore } from '@/core/store';
import ObjectEditor from './ObjectEditor.vue';

const globalSelection = useSelectionStore();
</script>

<template>
  <p>以下为选中的节点/边的参数。</p>
  <ObjectEditor v-if="globalSelection.stationSource"
    class="editor" caption="选择的起始节点"
    :target="globalSelection.stationSource.data" :freeze="[['name']]"
    @submit="changes => globalSelection.patchStationSource(changes)"/>
  <ObjectEditor v-if="globalSelection.stationTarget"
    class="editor" caption="选择的终止节点"
    :target="globalSelection.stationTarget.data" :freeze="[['name']]"
    @submit="changes => globalSelection.patchStationTarget(changes)"/>
  <ObjectEditor v-if="globalSelection.route"
    class="editor" caption="选择的边"
    :target="globalSelection.route.data"
    @submit="changes => globalSelection.patchRoute(changes)"/>
</template>

<style scoped>
.editor {
  margin-top: 8px;
}
</style>
