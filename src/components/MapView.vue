<script setup lang="ts">
import * as d3 from 'd3';
import { useTemplateRef, watch, type PropType } from 'vue';
import { d3v } from '@/vueshim/d3v';
import type { data, render } from '@/core/dtypes';
import type { EdgeOf, VertexOf } from '@/core/graph/graph';
import { type TrainGraph, stationDegree, routeDegree, routeShiftApprox } from '@/core/data-adapter';


const { viewSize, mapCenter, mapScale, graph } = defineProps({
  viewSize: { type: Object as PropType<[number, number]>, default: [975, 700] },
  mapCenter: { type: Object as PropType<[number, number]>, default: [100, 38] },
  mapScale: { type: Number, default: 800 },
  map: { type: Object as PropType<render.MapData>, required: true },
  graph: { type: Object as PropType<TrainGraph>, required: true },
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

function geoToTranslation(geo: [number, number]) {
  const [a, b] = projection(geo)!;
  return `translate(${a}, ${b})`;
}

const geoPath = $computed(() => d3.geoPath(projection));

// TODO: 根据数据范围动态决定下列比例尺。

const nodeRadiusScale = d3.scaleLinear<number>()
  .domain([0, 15])
  .range([5, 15]);

const nodeColorScale = d3.scaleLinear<string>()
  .domain([10000, 25000]) // 假设节点的数量在 0 到 100 之间
  .range(["steelblue", "tomato"]);

const lineWidthScale = d3.scaleLinear<number>()
  .domain([0, 30]) // 假设节点的数量在 0 到 100 之间
  .range([1.5, 10.5]);

const lineColorScale = d3.scaleLinear<string>()
  .domain([10000, 160000])
  .range(["steelblue", "tomato"]);

const lineGenerator = d3.line()
  .x(d => projection(d)![0])
  .y(d => projection(d)![1]);

// 此处必须为shallowRef，否则vertex会被递归转换，导致判等失效。
let hoveredStation = $shallowRef<VertexOf<typeof graph> | null>(null);
watch(() => graph, () => { hoveredStation = null; });
function* reorderedStations() {
  for (const vertex of graph.vertices.values()) { if (vertex !== hoveredStation) yield vertex; }
  if (hoveredStation) yield hoveredStation;
}

let chosenSource = $(defineModel<VertexOf<typeof graph> | null>('chosenSource', { default: null }));
let chosenTarget = $(defineModel<VertexOf<typeof graph> | null>('chosenTarget', { default: null }));
let chosenRoute = $(defineModel<EdgeOf<typeof graph> | null>('chosenRoute', { default: null }));
watch(() => graph, () => { chosenSource = null; chosenTarget = null; chosenRoute = null; });
function toggleChosenSource(id: VertexOf<typeof graph>) {
  chosenSource = chosenSource === id ? null : id;
}
function toggleChosenTarget(id: VertexOf<typeof graph>) {
  chosenTarget = chosenTarget === id ? null : id;
}
function toggleChosenRoute(id: EdgeOf<typeof graph>) {
  chosenRoute = chosenRoute === id ? null : id;
}

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
        <g class="lines">
          <template v-for="edge in graph.outOrderEdges()" :key="edge">
            <path class="route"
              :class="{ chosen: edge === chosenRoute }"
              @click.stop="toggleChosenRoute(edge)"
              :d="lineGenerator([edge.source.data.geo, edge.target.data.geo])!"
              :stroke-width="lineWidthScale(routeDegree(edge)) / transform.k"
              :stroke="lineColorScale(routeShiftApprox(edge))"
            />
          </template>
        </g>
        <g class="nodes">
          <template v-for="vertex in reorderedStations()" :key="vertex">
            <g class="station" :class="{ hovered: hoveredStation === vertex }"
              :transform="geoToTranslation(vertex.data.geo)"
              @mouseover="hoveredStation = vertex"
            >
              <rect class="station-text-bg"
                :x="nodeRadiusScale(stationDegree(vertex)) / transform.k" :y="-10 / transform.k"
                :width="50 / transform.k" :height="20 / transform.k"
                :rx="5 / transform.k" :ry="5 / transform.k"
              />
              <circle class="station-point"
                :class="{ 'chosen-src': vertex === chosenSource, 'chosen-dst': vertex === chosenTarget }"
                @click.prevent.stop="toggleChosenSource(vertex)"
                @contextmenu.prevent.stop="toggleChosenTarget(vertex)"
                :stroke-width="2 / transform.k"
                :r="nodeRadiusScale(stationDegree(vertex)) / transform.k" 
                :fill="nodeColorScale(vertex.data.access)"
              />
              <text cursor="pointer" text-anchor="middle"
                :x="(25 + nodeRadiusScale(stationDegree(vertex))) / transform.k" :y="3.5 / transform.k"
                :font-size="`${12 / transform.k}px`" 
              >{{ vertex.data.name }}</text>
            </g>
          </template>
        </g>
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

.station-text-bg {
  fill: white;
  opacity: 0.7;
}

.station.hovered > .station-text-bg {
  opacity: 1;
}

.station-point {
  stroke: white;
}

.station-point.chosen-src {
  stroke: red;
}

.station-point.chosen-dst {
  stroke: yellow;
}

.route {
  fill: none;
  opacity: 0.7;
}

.route.chosen {
  opacity: 1;
}
</style>
