<script setup lang="ts">
import * as d3 from 'd3';
import { watch, type PropType } from 'vue';
import { vD3Raise } from '@/vueshim/d3v';
import type { EdgeOf, VertexOf } from '@/core/graph/graph';
import { type TrainGraph, stationDegree, routeDegree, routeShiftApprox } from '@/core/data-adapter';
import ColorLegend from './ColorLegend.vue';
import WidthLegend from './WidthLegend.vue';

const { transform, projection, graph } = defineProps({
  transform: { type: Object as PropType<d3.ZoomTransform>, required: true },
  projection: { type: Function as PropType<d3.GeoProjection>, required: true },
  graph: { type: Object as PropType<TrainGraph>, required: true },
});

function geoToTranslation(geo: [number, number]) {
  const [a, b] = projection(geo)!;
  return `translate(${a}, ${b})`;
}

const lineGenerator = d3.line()
  .x(d => projection(d)![0])
  .y(d => projection(d)![1]);

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

type GVertex = VertexOf<typeof graph>;
type GEdge = EdgeOf<typeof graph>;

// 此处必须为shallowRef，否则vertex会被递归转换，导致判等失效。
let hoveredStation = $shallowRef<GVertex | null>(null);
let hoveredRoute = $shallowRef<GEdge | null>(null);
watch(() => graph, () => { hoveredStation = null; hoveredRoute = null; });
function isHoveredStation(station: GVertex) { return station === hoveredStation; }
function isHoveredRoute(route: GEdge) { return route === hoveredRoute; }

let chosenSource = $(defineModel<GVertex | null>('chosenSource', { default: null }));
let chosenTarget = $(defineModel<GVertex | null>('chosenTarget', { default: null }));
let chosenRoute = $(defineModel<GEdge | null>('chosenRoute', { default: null }));
watch(() => graph, () => { chosenSource = null; chosenTarget = null; chosenRoute = null; });
function isChosenSource(station: GVertex) { return station === chosenSource; }
function isChosenTarget(station: GVertex) { return station === chosenTarget; }
function isChosenRoute(route: GEdge) { return route === chosenRoute; }
function toggleChosenSource(id: GVertex) { chosenSource = chosenSource === id ? null : id; }
function toggleChosenTarget(id: GVertex) { chosenTarget = chosenTarget === id ? null : id; }
function toggleChosenRoute(id: GEdge) { chosenRoute = chosenRoute === id ? null : id; }
</script>

<template>
  <g :transform="transform.toString()">
    <g class="lines">
      <path v-if="chosenRoute" class="route-highlight"
        :d="lineGenerator([chosenRoute.source.data.geo, chosenRoute.target.data.geo])!"
        :stroke-width="(lineWidthScale(routeDegree(chosenRoute)) + 5) / transform.k"
      />
      <template v-for="edge in graph.outOrderEdges()" :key="edge">
        <path class="route"
          :class="{
            hovered: isHoveredRoute(edge),
            chosen: isChosenRoute(edge),
          }"
          v-d3-raise="isHoveredRoute(edge)"
          @click.stop="toggleChosenRoute(edge)"
          :d="lineGenerator([edge.source.data.geo, edge.target.data.geo])!"
          :stroke-width="lineWidthScale(routeDegree(edge)) / transform.k"
          :stroke="lineColorScale(routeShiftApprox(edge))"
          @mouseover.stop="hoveredRoute = edge"
          @mouseout.stop="hoveredRoute = null"
        />
      </template>
    </g>
    <g class="nodes">
      <template v-for="vertex in graph.vertices.values()" :key="vertex">
        <g class="station"
          :class="{
            hovered: isHoveredStation(vertex),
            'chosen-src': isChosenSource(vertex),
            'chosen-dst': isChosenTarget(vertex),
          }"
          v-d3-raise="isHoveredStation(vertex)"
          :transform="geoToTranslation(vertex.data.geo)"
          @mouseover.stop="hoveredStation = vertex"
          @mouseout.stop="hoveredStation = null">
          <rect class="station-text-bg"
            :x="nodeRadiusScale(stationDegree(vertex)) / transform.k" :y="-10 / transform.k"
            :width="50 / transform.k" :height="20 / transform.k"
            :rx="5 / transform.k" :ry="5 / transform.k"
          />
          <circle class="station-point"
            @click.prevent.stop="toggleChosenSource(vertex)"
            @contextmenu.prevent.stop="toggleChosenTarget(vertex)"
            :stroke-width="2 / transform.k"
            :r="nodeRadiusScale(stationDegree(vertex)) / transform.k" 
            :fill="nodeColorScale(vertex.data.access)"
          />
          <text class="station-text"
            cursor="pointer" text-anchor="middle"
            :x="(25 + nodeRadiusScale(stationDegree(vertex))) / transform.k" :y="3.5 / transform.k"
            :font-size="`${12 / transform.k}px`" v-text="vertex.data.name"/>
        </g>
      </template>
    </g>
  </g>
  <g class="legends">
    <ColorLegend :scaler="nodeColorScale"
      transform="translate(20, 20)"
      :icon-width="20" :icon-height="15"
      caption="节点颜色：年均到达人数（单位：万人）">
      <template #icon-left="{ color }">
        <circle cx="10" cy="7.5" r="7" :fill="color"/>
      </template>
      <template #icon-right="{ color }">
        <circle cx="10" cy="7.5" r="7" :fill="color"/>
      </template>
    </ColorLegend>
    <ColorLegend :scaler="lineColorScale"
      transform="translate(20, 80)"
      :icon-width="20" :icon-height="15"
      caption="边颜色：年均客流量（单位：万人）">
      <template #icon-left="{ color }">
        <line x1="4.5" y1="13" x2="15.5" y2="2" stroke-width="2" :stroke="color"/>
      </template>
      <template #icon-right="{ color }">
        <line x1="4.5" y1="13" x2="15.5" y2="2" stroke-width="2" :stroke="color"/>
      </template>
    </ColorLegend>
    <WidthLegend :scaler="nodeRadiusScale"
      transform="translate(20, 140)"
      :icon-width="20" :icon-height="15"
      caption="节点宽度：节点的度">
      <template #icon-left="{ size }">
        <circle cx="10" cy="7.5" fill="#ffd" stroke="#000" :r="size / 2"/>
      </template>
      <template #icon-right="{ size }">
        <circle cx="10" cy="7.5" fill="#ffd" stroke="#000" :r="size / 2"/>
      </template>
    </WidthLegend>
    <WidthLegend :scaler="lineWidthScale"
      transform="translate(20, 200)"
      :icon-width="20" :icon-height="15"
      caption="边宽度：边的度（两端节点的平均度数）">
      <template #icon-left="{ size }">
        <line x1="4.5" y1="13" x2="15.5" y2="2" stroke="black" :stroke-width="size"/>
      </template>
      <template #icon-right="{ size }">
        <line x1="4.5" y1="13" x2="15.5" y2="2" stroke="black" :stroke-width="size"/>
      </template>
    </WidthLegend>
  </g>
</template>

<style scoped>
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

.station.chosen-src > .station-point {
  stroke: red;
}

.station.chosen-dst > .station-point {
  stroke: yellow;
}

.route {
  fill: none;
  opacity: 0.7;
}

.route-highlight {
  fill: none;
  stroke: yellow;
  opacity: 1;
}
</style>
