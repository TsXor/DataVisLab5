<script setup lang="ts">
import * as d3 from 'd3';
import { ref, type PropType } from 'vue';
import { d3ovr, d3u, vD3Apply } from '@/vueshim/d3v';
import { svgu } from '@/vueshim/utils';
import DataSuspense from './DataSuspense.vue';
import MapView from './MapView.vue';
import GraphView from './GraphView.vue';
import DistanceTopology from './DistanceTopology.vue';

const { viewSize, mapCenter, mapScale } = defineProps({
  viewSize: { type: Object as PropType<[number, number]>, default: [975, 700] },
  mapCenter: { type: Object as PropType<[number, number]>, default: [100, 38] },
  mapScale: { type: Number, default: 800 },
});

const selected = ref('map');

const viewBox = $computed(() => {
  const [width, height] = viewSize;
  return svgu.viewbox(0, 0, width, height);
});

const zoom = d3u.zoomController(d3ovr.zoom().scaleExtent([0.01, 8]));
const transform = $(zoom.state);
const toMiddle = () => {
  const [width, height] = viewSize;
  zoom.transform(d3.zoomIdentity.translate(width / 2, height / 2));
};

const projection = $computed(() => {
  return d3.geoMercator()
    .center(mapCenter) /* 设置地图的中心（可以根据数据调整） */
    .scale(mapScale) /* 缩放级别（根据数据调整） */
    .translate([0, 0]) /* 不平移 */;
});

function resetZoom() {
  const [width, height] = viewSize;
  zoom.transform(
    d3.zoomIdentity.translate(width / 2, height / 2),
    transform.invert([width / 2, height / 2]),
    t => t.duration(750),
  );
}

function focusRegion(bounds?: [[number, number], [number, number]], event?: MouseEvent) {
  const [width, height] = viewSize;
  const zoomLimit = 8;
  const zoomBase = 0.9;
  if (bounds) { // 缩放到适合区域
    const [[x0, y0], [x1, y1]] = bounds;
    zoom.transform(
      d3.zoomIdentity.translate(width / 2, height / 2)
        .scale(Math.min(zoomLimit, zoomBase / Math.max((x1 - x0) / width, (y1 - y0) / height))) 
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      event ? d3.pointer(event, zoom.selection!.node()) : undefined,
      t => t.duration(750),
    );
  } else { // 重置缩放
    resetZoom();
  }
}
</script>

<template>
  <div>
    <div class="control-bar">
      <select class="chooser" v-model="selected">
        <option value="map">地图视图</option>
        <option value="dist">距离拓扑</option>
      </select>
      <button class="zoom-reseter"
        @click="resetZoom()" v-text="'重置视图位置'"/>
      <button class="topo-reseter" v-show="selected === 'dist'"
        @click="$refs.topo?.reset()" v-text="'重置距离拓扑'"/>
    </div>
    <DataSuspense v-slot="{ graph, map }">
      <div class="aligner">
        <svg :viewBox="viewBox" @contextmenu.prevent v-d3-apply="[zoom, toMiddle]">
          <g v-show="selected === 'map'">
            <MapView :map="map" :transform="transform" :projection="projection"
              @focusRegion="(bounds, event) => focusRegion(bounds, event)"/>
            <GraphView :graph="graph" :transform="transform" :projection="projection"/>
          </g>
          <g v-show="selected === 'dist'">
            <DistanceTopology ref="topo" :graph="graph" :transform="transform" :projection="projection"/>
          </g>
        </svg>
      </div>
    </DataSuspense>
  </div>
</template>

<style scoped>
.chooser, .topo-reseter, .zoom-reseter {
  margin: 5px;
}

.aligner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: auto;
}

svg {
  max-width: 100%;
  height: auto;
}
</style>
