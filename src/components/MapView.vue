<script setup lang="ts">
import * as d3 from 'd3';
import { useTemplateRef, watch, type PropType } from 'vue';
import { d3v } from '@/vueshim/d3v';
import type { data, render } from '@/core/dtypes';

defineSlots<{
  default(props: { transform: d3.ZoomTransform; projection: d3.GeoProjection }): any
}>();

const { viewSize, mapCenter, mapScale } = defineProps({
  viewSize: { type: Object as PropType<[number, number]>, default: [975, 700] },
  mapCenter: { type: Object as PropType<[number, number]>, default: [100, 38] },
  mapScale: { type: Number, default: 800 },
  map: { type: Object as PropType<render.MapData>, required: true },
});

const viewBox = $computed(() => {
  const [width, height] = viewSize;
  return `0 0 ${width} ${height}`;
});

const containerElement = useTemplateRef('container');
const container = d3v.selectRef(containerElement);
const zoom = new d3v.Zoom(container, { scaleExtent: [0.01, 8] });
const transform = $(d3v.useZoomTransform(zoom));

const projection = $computed(() => {
  const [width, height] = viewSize;
  return d3.geoMercator()
    .center(mapCenter) /* 设置地图的中心（可以根据数据调整） */
    .scale(mapScale) /* 缩放级别（根据数据调整） */
    .translate([width / 2, height / 2]) /* 平移到屏幕中心 */;
})

const geoPath = $computed(() => d3.geoPath(projection));

// 此处必须为shallowRef，否则region会被递归转换，导致判等失效。
let focusedRegion = $shallowRef<{region: data.Region, pos: [number, number]} | null>(null);
function toggleFocusedRegion(event: MouseEvent, region: data.Region) {
  focusedRegion = focusedRegion?.region === region ? null : { region, pos: d3.pointer(event, container.value!.node()!) };
}
// 在省份注意点转换时，执行缩放
watch($$(focusedRegion), focus => {
  const [width, height] = viewSize;
  const zoomLimit = 8;
  const zoomBase = 0.9;
  if (focus) { // 缩放到适合区域
    const [[x0, y0], [x1, y1]] = geoPath.bounds(focus.region);
    zoom.transform(
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(zoomLimit, zoomBase / Math.max((x1 - x0) / width, (y1 - y0) / height))) 
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      { point: focus.pos, transition: { duration: 750 } }
    );
  } else { // 重置缩放
    zoom.transform(
      d3.zoomIdentity,
      { point: transform!.invert([width / 2, height / 2]), transition: { duration: 750 } }
    );
  }
});
</script>

<template>
  <div class="aligner">
    <svg ref="container" :viewBox="viewBox" @contextmenu.prevent>
      <g :transform="transform.toString()" @click.stop="focusedRegion = null">
        <g class="map">
          <!-- provinces -->
          <g stroke-width="2">
            <template v-for="feat in map.provinces.features">
              <path class="rough-border" :d="geoPath(feat)!"/>
            </template>
          </g>
          <!-- counties -->
          <g :stroke-width="0.5 / transform.k">
            <template v-for="feat in map.counties.features">
              <path class="precise-border" :d="geoPath(feat)!"><title :text="feat.properties.name"/></path>
            </template>
          </g>
          <!-- provinces -->
          <g :stroke-width="0 / transform.k">
            <template v-for="feat in map.provinces.features">
              <path class="precise-border" :d="geoPath(feat)!"
                :class="{ focused: focusedRegion?.region === feat }"
                @click.stop="event => toggleFocusedRegion(event, feat)"
              ><title :text="feat.properties.name"/></path>
            </template>
          </g>
        </g>
        <slot :transform="transform" :projection="projection"/>
      </g>
    </svg>
  </div>
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

.rough-border {
  fill: none;
  stroke: #aaa;
}

.precise-border {
  cursor: pointer;
  fill: rgba(128, 128, 128, 0.2);
  stroke: #444;
}

.precise-border.focused {
  fill: rgba(0, 0, 0, 0.2);
  transition: fill 250ms; /* d3的默认duration */
}
</style>
