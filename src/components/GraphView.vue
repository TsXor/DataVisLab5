<script setup lang="ts">
import { type TrainGraph } from '@/core/data-adapter';
import { filterRoute, filterStation, routeDegree, routeShiftApprox, stationDegree, type RangeFilter, type Scalers } from '@/core/data-utils';
import type { EdgeOf, VertexOf } from '@/core/graph/graph';
import { useFilterStore, useSelectionStore } from '@/core/store';
import { vD3Raise } from '@/vueshim/d3v';
import { svgu } from '@/vueshim/utils';
import * as d3 from 'd3';
import { computed, watch, type PropType } from 'vue';
import ColorLegend from './ColorLegend.vue';
import WidthLegend from './WidthLegend.vue';

const globalSelection = useSelectionStore();

const filter = useFilterStore();

function filterMinMaxRef(range: () => RangeFilter) {
  const min = computed({
    get() { return range().min },
    set(value) { range().min = value }
  });
  const max = computed({
    get() { return range().max },
    set(value) { range().max = value }
  });
  return { min, max };
}
const { min: stationDegreeMin, max: stationDegreeMax } = filterMinMaxRef(() => filter.station.stationDegree);
const { min: stationAccessMin, max: stationAccessMax } = filterMinMaxRef(() => filter.station.stationAccess);
const { min: routeDegreeMin, max: routeDegreeMax } = filterMinMaxRef(() => filter.route.routeDegree);
const { min: routeShiftMin, max: routeShiftMax } = filterMinMaxRef(() => filter.route.routeShift);

const { transform, projection, graph, scalers } = defineProps({
  transform: { type: Object as PropType<d3.ZoomTransform>, required: true },
  projection: { type: Function as PropType<d3.GeoProjection>, required: true },
  graph: { type: Object as PropType<TrainGraph>, required: true },
  scalers: { type: Object as PropType<Scalers>, required: true },
});

const linear = d3.line();
function projectedLine(points: [number, number][]) {
  return linear(points.map(p => transform.apply(projection(p)!)));
}

type GVertex = VertexOf<typeof graph>;
type GEdge = EdgeOf<typeof graph>;

function stationPosition(station: GVertex) {
  return transform.apply(projection(station.data.geo)!);
}

function routeLine(route: GEdge) {
  return projectedLine([route.source.data.geo, route.target.data.geo])!;
}

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
  <g class="lines">
    <g>
      <!-- 将不常更新的属性提升，以减少更新开销 -->
      <g v-for="edge in graph.outOrderEdges()"
        v-show="filterRoute(edge, filter.route)"
        :stroke-width="scalers.lineWidth(routeDegree(edge))"
        :stroke="scalers.lineColor(routeShiftApprox(edge))"
        v-d3-raise="isHoveredRoute(edge)">
        <!-- 隐藏选中的边 -->
        <path class="route" v-show="edge !== chosenRoute"
          :class="{ hovered: isHoveredRoute(edge) }"
          @click.stop="toggleChosenRoute(edge)"
          :d="routeLine(edge)"
          @mouseover.stop="hoveredRoute = edge"
          @mouseout.stop="hoveredRoute = null"/>
      </g>
    </g>
    <g>
      <path class="route highlight shortest" v-for="trace in globalSelection.pathEdges.keys()"
        @click.stop="toggleChosenRoute(trace)"
        :d="routeLine(trace)"
        :stroke-width="(scalers.lineWidth(routeDegree(trace)) + 5)"/>
      <path class="route highlight chosen" v-if="chosenRoute"
        @click.stop="toggleChosenRoute(chosenRoute)"
        :d="routeLine(chosenRoute)"
        :stroke-width="(scalers.lineWidth(routeDegree(chosenRoute)) + 5)"/>
      <!-- 单独显示选中的边 -->
      <path class="route chosen" v-if="chosenRoute"
        :class="{ hovered: isHoveredRoute(chosenRoute) }"
        @click.stop="toggleChosenRoute(chosenRoute)"
        :d="routeLine(chosenRoute)"
        :stroke-width="scalers.lineWidth(routeDegree(chosenRoute))"
        :stroke="scalers.lineColor(routeShiftApprox(chosenRoute))"
        @mouseover.stop="hoveredRoute = chosenRoute"
        @mouseout.stop="hoveredRoute = null"/>
    </g>
  </g>
  <g class="nodes">
    <g v-for="vertex in graph.vertices.values()"
      v-show="filterStation(vertex, filter.station)"
      :transform="svgu.translateOf(stationPosition(vertex))"
      v-d3-raise="isHoveredStation(vertex)">
      <g class="station"
        :class="{
          hovered: isHoveredStation(vertex),
          'chosen-src': isChosenSource(vertex),
          'chosen-dst': isChosenTarget(vertex),
        }"
        @mouseover.stop="hoveredStation = vertex"
        @mouseout.stop="hoveredStation = null">
        <rect class="station-text-bg"
          :x="scalers.nodeRadius(stationDegree(vertex))" :y="-10"
          :width="50" :height="20"
          :rx="5" :ry="5"/>
        <circle class="station-point"
          @click.prevent.stop="toggleChosenSource(vertex)"
          @contextmenu.prevent.stop="toggleChosenTarget(vertex)"
          :stroke-width="2"
          :r="scalers.nodeRadius(stationDegree(vertex))" 
          :fill="scalers.nodeColor(vertex.data.access)"/>
        <text class="station-text"
          cursor="pointer" text-anchor="middle"
          :x="(25 + scalers.nodeRadius(stationDegree(vertex)))" :y="3.5"
          :font-size="`${12}px`" v-text="vertex.data.name"/>
      </g>
    </g>
  </g>
  <g class="legends">
    <ColorLegend :scaler="scalers.nodeColor"
      v-model:filter-min="stationAccessMin"
      v-model:filter-max="stationAccessMax"
      :transform="svgu.translate(20, 20)"
      :icon-width="20" :icon-height="15"
      caption="节点颜色：年均到达人数（单位：万人）">
      <template #icon-left="{ color }">
        <circle cx="10" cy="7.5" r="7" :fill="color"/>
      </template>
      <template #icon-right="{ color }">
        <circle cx="10" cy="7.5" r="7" :fill="color"/>
      </template>
    </ColorLegend>
    <ColorLegend :scaler="scalers.lineColor"
      v-model:filter-min="routeShiftMin"
      v-model:filter-max="routeShiftMax"
      :transform="svgu.translate(20, 80)"
      :icon-width="20" :icon-height="15"
      caption="边颜色：年均客流量（单位：万人）">
      <template #icon-left="{ color }">
        <line x1="4.5" y1="13" x2="15.5" y2="2" stroke-width="2" :stroke="color"/>
      </template>
      <template #icon-right="{ color }">
        <line x1="4.5" y1="13" x2="15.5" y2="2" stroke-width="2" :stroke="color"/>
      </template>
    </ColorLegend>
    <WidthLegend :scaler="scalers.nodeRadius"
      v-model:filter-min="stationDegreeMin"
      v-model:filter-max="stationDegreeMax"
      :transform="svgu.translate(20, 140)"
      :icon-width="20" :icon-height="15"
      caption="节点宽度：节点的度">
      <template #icon-left="{ size }">
        <circle cx="10" cy="7.5" fill="#ffd" stroke="#000" :r="size / 2"/>
      </template>
      <template #icon-right="{ size }">
        <circle cx="10" cy="7.5" fill="#ffd" stroke="#000" :r="size / 2"/>
      </template>
    </WidthLegend>
    <WidthLegend :scaler="scalers.lineWidth"
      v-model:filter-min="routeDegreeMin"
      v-model:filter-max="routeDegreeMax"
      :transform="svgu.translate(20, 200)"
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
  cursor: pointer;
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
  cursor: pointer;
}

.route.highlight {
  opacity: 0.5;
}

.route.highlight.chosen {
  stroke: yellow;
}

.route.highlight.shortest {
  stroke: red;
}
</style>
