<script setup lang="ts">
import * as d3 from 'd3';
import { watch, type PropType } from 'vue';
import { d3ovr, d3u, vD3Apply } from '@/vueshim/d3v';
import type { data, render } from '@/core/dtypes';
import { svgu } from '@/vueshim/utils';

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
  return svgu.viewbox(0, 0, width, height);
});

const zoom = d3u.zoomController(d3ovr.zoom().scaleExtent([0.01, 8]));
const transform = $(zoom.state);

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
function isFocusedRegion(region: data.Region) { return focusedRegion?.region === region; }
function toggleFocusedRegion(event: MouseEvent, region: data.Region) {
  focusedRegion = isFocusedRegion(region) ? null : { region,
    pos: d3.pointer(event, zoom.selection!.node())
  };
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
      focus.pos,
      t => t.duration(750),
    );
  } else { // 重置缩放
    zoom.transform(
      d3.zoomIdentity,
      transform.invert([width / 2, height / 2]),
      t => t.duration(750),
    );
  }
});
</script>

<template>
  <div class="aligner">
    <svg :viewBox="viewBox" @contextmenu.prevent v-d3-apply="zoom">
      <g :transform="transform.toString()" @click.stop="focusedRegion = null">
        <g class="map">
          <!-- provinces -->
          <g :stroke-width="2">
            <g v-memo="[map.provinces]">
              <template v-for="feat in map.provinces.features">
                <path class="rough-border" :d="geoPath(feat)!"/>
              </template>
            </g>
          </g>
          <!-- counties -->
          <g :stroke-width="0.5 / transform.k">
            <g v-memo="[map.counties]">
              <template v-for="feat in map.counties.features">
                <path class="precise-border" :d="geoPath(feat)!">
                  <title :text="feat.properties.name"/>
                </path>
              </template>
            </g>
          </g>
          <!-- provinces -->
          <g :stroke-width="0 / transform.k">
            <g v-memo="[map.provinces, focusedRegion]">
              <template v-for="feat in map.provinces.features" v-memo="[isFocusedRegion(feat)]">
                <path class="precise-border" :d="geoPath(feat)!"
                  :class="{ focused: isFocusedRegion(feat) }"
                  @click.stop="event => toggleFocusedRegion(event, feat)">
                  <title :text="feat.properties.name"/>
                </path>
              </template>
            </g>
          </g>
        </g>
      </g>
      <slot :transform="transform" :projection="projection"/>
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
