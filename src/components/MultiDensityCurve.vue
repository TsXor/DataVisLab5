<script setup lang="ts">
import { ref } from 'vue';
import { useGraphStore } from '@/core/store';
import DensityCurve from './DensityCurve.vue';

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
      <h2>客流密度-里程图</h2>
      <p>x=a到x=b之间的面积S表示平均每年有S万人次乘坐火车的里程(km)在a与b之间。</p>
    </div>
    <DensityCurve class="view" v-if="graph.distance" :graph="graph.distance"/>
    <div class="loading" v-else>
      <p>线路图数据加载中...</p>
    </div>
  </div>
  <div class="content" v-if="selected === 'duration'">
    <div>
      <h2>Work Work</h2>
      <p>此处的内容正在施工中。</p>
      <p>事实上很容易实现，但是我要揣摩原作者意图。</p>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 30px;
}
</style>
