<script setup lang="ts">
import { proxyRefs, watch, type PropType } from 'vue';
import { useAsyncState } from '@vueuse/core';
import { asSuccess } from '@/core/utils';
import { type MapDataResult, type TrainGraph, type TrainGraphResult } from '@/core/data-adapter';
import type { render } from '@/core/dtypes';

defineSlots<{
  default(props: { graph: TrainGraph; map: render.MapData }): any
}>();

const { map, graph } = defineProps({
  map: { type: Promise as PropType<Promise<MapDataResult>>, required: true },
  graph: { type: Promise as PropType<Promise<TrainGraphResult>>, required: true },
});

const emit = defineEmits<{
  ready: [data: { graph: TrainGraph, map: render.MapData }];
}>();

const mapAsync = proxyRefs(useAsyncState(map, null));
const graphAsync = proxyRefs(useAsyncState(graph, null));

const isReady = $computed(() =>
  graphAsync.isReady && mapAsync.isReady &&
  graphAsync.state!.success && mapAsync.state!.success
);
watch($$(isReady), ready => {
  if (ready) emit('ready', {
    graph: asSuccess(graphAsync.state!),
    map: asSuccess(mapAsync.state!),
  });
});
</script>

<template>
  <div>
    <template v-if="isReady">
      <slot :graph="asSuccess(graphAsync.state!)" :map="asSuccess(mapAsync.state!)"/>
    </template>
    <div v-else class="message">
      <p>加载状态：</p>
      <template v-if="graphAsync.isLoading">
        <p>线路图数据加载中...</p>
      </template>
      <template v-else-if="graphAsync.state">
        <template v-if="graphAsync.state.success">
          <p>线路图数据加载完成。</p>
        </template>
        <template v-else>
          <p>线路图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(graphAsync.state.failure) }}</pre>
        </template>
      </template>
      <template v-else>
        <p>线路图数据加载失败，发生未知错误。</p>
      </template>
      <template v-if="mapAsync.isLoading">
        <p>地图数据加载中...</p>
      </template>
      <template v-else-if="mapAsync.state">
        <template v-if="mapAsync.state.success">
          <p>地图数据加载完成。</p>
        </template>
        <template v-else>
          <p>地图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(mapAsync.state.failure) }}</pre>
        </template>
      </template>
      <template v-else>
        <p>地图数据加载失败，发生未知错误。</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.message {
  margin: 5%;
}
</style>
