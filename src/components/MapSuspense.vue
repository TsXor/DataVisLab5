<script setup lang="ts">
import { inject } from 'vue';
import MapView from './MapView.vue';
import { graphKey, mapKey } from '@/main';
import { asSuccess } from '@/core/utils';

const graph = inject(graphKey)!;
const map = inject(mapKey)!;

const isReady = $computed(() =>
  graph.isReady.value && map.isReady.value &&
  graph.state.value!.success && map.state.value!.success
);
</script>

<template>
  <div>
    <template v-if="isReady">
      <MapView :graph="asSuccess(graph.state.value!)" :borders="asSuccess(map.state.value!)"/>
    </template>
    <div v-else class="message">
      <p>加载状态：</p>
      <template v-if="graph.isLoading.value">
        <p>线路图数据加载中...</p>
      </template>
      <template v-else-if="graph.state.value">
        <template v-if="graph.state.value.success">
          <p>线路图数据加载完成。</p>
        </template>
        <template v-else>
          <p>线路图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(graph.state.value.failure) }}</pre>
        </template>
      </template>
      <template v-else>
        <p>线路图数据加载失败，发生未知错误。</p>
      </template>
      <template v-if="map.isLoading.value">
        <p>地图数据加载中...</p>
      </template>
      <template v-else-if="map.state.value">
        <template v-if="map.state.value.success">
          <p>地图数据加载完成。</p>
        </template>
        <template v-else>
          <p>地图数据加载失败，调试信息如下：</p>
          <pre lang="json">{{ JSON.stringify(map.state.value.failure) }}</pre>
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
