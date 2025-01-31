<script setup lang="ts">
import { inject, watch } from 'vue';
import { useAsyncState } from '@vueuse/core';
import { graphKey } from '@/main';
import { asSuccess } from '@/core/utils';
import { collectMapData, collectTrainGraph, type TrainGraph } from '@/core/data-adapter';
import type { render } from '@/core/dtypes';

defineSlots<{
  default(props: { graph: TrainGraph; map: render.MapData }): any
}>();

const mapAsync = useAsyncState(collectMapData(), null);
const graphAsync = useAsyncState(collectTrainGraph(), null);

const graph = inject(graphKey)!;
watch(graphAsync.state, result => {
  if (result?.success) graph.value = result.data;
});

const isReady = $computed(() =>
  graphAsync.isReady.value && mapAsync.isReady.value &&
  graphAsync.state.value!.success && mapAsync.state.value!.success
);
</script>

<template>
  <div>
    <template v-if="isReady">
      <slot :graph="asSuccess(graphAsync.state.value!)" :map="asSuccess(mapAsync.state.value!)"/>
    </template>
    <div v-else class="message">
      <p>加载状态：</p>
      <template v-if="graphAsync.isLoading.value">
        <p>线路图数据加载中...</p>
      </template>
      <template v-else-if="graphAsync.state.value">
        <template v-if="graphAsync.state.value.success">
          <p>线路图数据加载完成。</p>
        </template>
        <template v-else>
          <p>线路图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(graphAsync.state.value.failure) }}</pre>
        </template>
      </template>
      <template v-else>
        <p>线路图数据加载失败，发生未知错误。</p>
      </template>
      <template v-if="mapAsync.isLoading.value">
        <p>地图数据加载中...</p>
      </template>
      <template v-else-if="mapAsync.state.value">
        <template v-if="mapAsync.state.value.success">
          <p>地图数据加载完成。</p>
        </template>
        <template v-else>
          <p>地图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(mapAsync.state.value.failure) }}</pre>
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
