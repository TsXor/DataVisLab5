<script setup lang="ts">
import * as d3 from 'd3';
import { onMounted, watch, type PropType } from 'vue';
import { d3ovr, d3u, vD3Apply } from '@/vueshim/d3v';
import { svgu } from '@/vueshim/utils';
import DataSuspense from './DataSuspense.vue';
import MapView from './MapView.vue';
import GraphView from './GraphView.vue';

const { viewSize } = defineProps({
  viewSize: { type: Object as PropType<[number, number]>, default: [975, 700] },
});

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
    zoom.transform(
      d3.zoomIdentity.translate(width / 2, height / 2),
      transform.invert([width / 2, height / 2]),
      t => t.duration(750),
    );
  }
}
</script>

<template>
  <DataSuspense id="map-view" v-slot="{ graph, map }">
    <div class="aligner">
      <svg :viewBox="viewBox" @contextmenu.prevent v-d3-apply="[zoom, toMiddle]">
        <MapView :map="map" :transform="transform" v-slot="{ projection }"
          @focusRegion="(bounds, event) => focusRegion(bounds, event)">
          <GraphView :graph="graph" :transform="transform" :projection="projection"/>
        </MapView>
      </svg>
    </div>
  </DataSuspense>
</template>

<style scoped>
.aligner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

svg {
  max-width: 100%;
  height: auto;
}
</style>
