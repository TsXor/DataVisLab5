<script setup lang="ts">
import { asSuccess } from '@/core/utils';
import { type TrainGraph } from '@/core/data-adapter';
import type { render } from '@/core/dtypes';
import { useGraphStore, useRemoteDataStore } from '@/core/store';
import type { DataExtents } from '@/core/data-utils';

defineSlots<{
  default(props: { graph: TrainGraph; map: render.MapData, extents: DataExtents }): any
}>();

const data = useRemoteDataStore();
const graph = useGraphStore();
</script>

<template>
  <div>
    <template v-if="data.isReady && graph.isReady">
      <slot :graph="graph.graph!" :map="asSuccess(data.map.state!)" :extents="graph.extents!"/>
    </template>
    <div v-else class="message">
      <p>加载状态：</p>
      <template v-if="data.graph.isLoading">
        <p>线路图数据加载中...</p>
      </template>
      <template v-else-if="data.graph.state">
        <template v-if="data.graph.state.success">
          <p>线路图数据加载完成。</p>
        </template>
        <template v-else>
          <p>线路图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(data.graph.state.failure) }}</pre>
        </template>
      </template>
      <template v-else>
        <p>线路图数据加载失败，发生未知错误。</p>
      </template>
      <template v-if="data.map.isLoading">
        <p>地图数据加载中...</p>
      </template>
      <template v-else-if="data.map.state">
        <template v-if="data.map.state.success">
          <p>地图数据加载完成。</p>
        </template>
        <template v-else>
          <p>地图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(data.map.state.failure) }}</pre>
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
