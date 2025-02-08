<script setup lang="ts">
import { ref } from 'vue';
import { useGraphStore } from '@/core/store';
import HeatMap from './HeatMap.vue';

const graph = useGraphStore();
const selected = ref('distance');
</script>

<template>
  <select v-model="selected">
    <option value="distance">最近距离</option>
    <option value="duration">最短时间</option>
  </select>
  <div class="content" v-if="selected === 'distance'">
    <div class="title">
      <h2>站点路程-热力图</h2>
      <p>表示任意两站之间的最短路程长度(km)。点击以在距离拓扑视图中观察最短路程。</p>
    </div>
    <HeatMap class="view" v-if="graph.distance" :graph="graph.distance"/>
    <div class="loading" v-else>
      <p>线路图数据加载中...</p>
    </div>
  </div>
  <div class="content" v-if="selected === 'duration'">
    <div>
      <h2>没活了可以咬打火机</h2>
      <p>我觉得这里应该有个时间热力图，但原作者没做。</p>
      <p>我就是闲着没事改版的，所以我也没做。</p>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 30px;
}
</style>
