<script setup lang="ts">
import { useFilterStore } from '@/core/store';
import RangeFilter from './RangeFilter.vue';

const filter = useFilterStore();
</script>

<template>
  <p>以下为节点/边过滤器的状态，可以进行精细调整。</p>
  <RangeFilter class="filter" caption="节点年均到达人数"
    :filter="filter.station.stationAccess"
    @edit="data => filter.station.stationAccess = data"/>
  <RangeFilter class="filter" caption="边年均客流量"
    :filter="filter.route.routeShift"
    @edit="data => filter.route.routeShift = data"/>
  <RangeFilter class="filter" caption="节点的度"
    :filter="filter.station.stationDegree"
    @edit="data => filter.station.stationDegree = data"/>
  <RangeFilter class="filter" caption="边的度"
    :filter="filter.route.routeDegree"
    @edit="data => filter.route.routeDegree = data"/>
</template>

<style scoped>
.filter {
  margin-top: 7px;
}
</style>
