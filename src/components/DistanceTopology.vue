<script setup lang="ts">
import { type TrainGraph } from '@/core/data-adapter';
import { routeDegree, routeDistance, routeShiftApprox, stationDegree, type Scalers } from '@/core/data-utils';
import type { EdgeOf, VertexOf } from '@/core/graph/graph';
import { d3ovr, vD3Apply, vD3Raise, type v } from '@/vueshim/d3v';
import { svgu, vRely } from '@/vueshim/utils';
import * as d3 from 'd3';
import { shallowReactive, watch, type PropType } from 'vue';

const { transform, projection, graph, scalers, container } = defineProps({
  transform: { type: Object as PropType<d3.ZoomTransform>, required: true },
  projection: { type: Function as PropType<d3.GeoProjection>, required: true },
  graph: { type: Object as PropType<TrainGraph>, required: true },
  scalers: { type: Object as PropType<Scalers>, required: true },
  container: { type: [Object, null] as PropType<SVGSVGElement | null>, required: true },
});

const linear = d3.line();

type GVertex = VertexOf<typeof graph>;
type GEdge = EdgeOf<typeof graph>;

// 此处必须为shallowRef，否则vertex会被递归转换，导致判等失效。
let hoveredStation = $shallowRef<GVertex | null>(null);
let hoveredRoute = $shallowRef<GEdge | null>(null);
watch(() => graph, () => { hoveredStation = null; hoveredRoute = null; });
function isHoveredStation(station: GVertex) { return station === hoveredStation; }
function isHoveredRoute(route: GEdge) { return route === hoveredRoute; }

type NodeDatum = GVertex & d3.SimulationNodeDatum;
type LinkDatum = GEdge & d3.SimulationLinkDatum<NodeDatum>;

function nodePosition(node: NodeDatum) {
  return transform.apply([node.x ?? 0, node.y ?? 0])
}

function linkLine(link: LinkDatum) {
  const src = link.source as NodeDatum;
  const dst = link.target as NodeDatum;
  const points = [
    [src.x ?? 0, src.y ?? 0],
    [dst.x ?? 0, dst.y ?? 0],
  ] as [number, number][];
  return linear(points.map(p => transform.apply(p)));
}

const drag = shallowReactive({
  node: null as NodeDatum | null,
  target: null as d3.SubjectPosition | null,
  force: (strength: number) => {
    return (() => {
      if (drag.node && drag.target) {
        const dx = drag.target.x - drag.node.x!;
        const dy = drag.target.y - drag.node.y!;
        drag.node.vx! += dx * strength;
        drag.node.vy! += dy * strength;
      }
    }) as d3.Force<NodeDatum, LinkDatum>;
  },
  behaviour: d3ovr.drag<Element, NodeDatum, d3.SubjectPosition>()
    .container(function () { return container ?? this.parentElement!; })
    .subject((_, datum) => ({ x: datum.x ?? 0, y: datum.y ?? 0 }))
    .on("start", (event, datum) => {
      drag.node = datum;
      drag.target = event.subject;
      simulation.alphaTarget(0.3).restart();
    })
    .on("drag", (event) => {
      event.subject.x += event.dx / transform.k;
      event.subject.y += event.dy / transform.k;
      drag.target = event.subject;
    })
    .on("end", () => {
      drag.node = null;
      drag.target = null;
      simulation.alphaTarget(0);
    }),
  apply: (node: NodeDatum) => {
    return (selection: v.Selection) => {
      selection.datum(node).call(drag.behaviour);
    };
  }
});

const linkForce = $computed(() => {
  const links = Array.from(graph.outOrderEdges());
  return d3.forceLink<NodeDatum, LinkDatum>(links)
    .distance(link => routeDistance(link))
    .strength(0.005);
});

let tick = $ref(0);

const simulation = $computed(() => {
  const nodes = Array.from(graph.vertices.values());
  nodes.forEach(node => {
    const datum = node as NodeDatum;
    if (datum.x === undefined || datum.y === undefined) {
      const [x, y] = projection(node.data.geo)!;
      datum.x = x; datum.y = y;
    }
  });
  return d3.forceSimulation<NodeDatum, LinkDatum>(nodes)
    .force("link", linkForce)
    .force("charge", d3.forceManyBody().strength(-10))
    .force("x", d3.forceX(0).strength(0.01))
    .force("y", d3.forceY(0).strength(0.01))
    .force("drag", drag.force(0.01))
    .on("tick", () => { tick += 1; });
});

defineExpose({
  reset: () => {
    simulation.stop();
    simulation.nodes().forEach(node => {
      const datum = node as NodeDatum;
      const [x, y] = projection(node.data.geo)!;
      datum.x = x; datum.y = y;
    });
    simulation.alpha(1).restart();
  }
});
</script>

<template>
  <g class="lines" v-rely="[tick]">
    <g v-for="edge in linkForce.links()"
      :stroke-width="scalers.lineWidth(routeDegree(edge))"
      :stroke="scalers.lineColor(routeShiftApprox(edge))"
      v-d3-raise="isHoveredRoute(edge)">
      <path class="route"
        :class="{ hovered: isHoveredRoute(edge) }"
        :d="linkLine(edge)!"
        @mouseover.stop="hoveredRoute = edge"
        @mouseout.stop="hoveredRoute = null"/>
    </g>
  </g>
  <g class="nodes" v-rely="[tick]">
    <g v-for="vertex in simulation.nodes()"
      :transform="svgu.translateOf(nodePosition(vertex))"
      v-d3-raise="isHoveredStation(vertex)">
      <g class="station"
        :class="{
          hovered: isHoveredStation(vertex),
          dragged: vertex === drag.node,
        }"
        @mouseover.stop="hoveredStation = vertex"
        @mouseout.stop="hoveredStation = null">
        <rect class="station-text-bg"
          :x="scalers.nodeRadius(stationDegree(vertex))" :y="-10"
          :width="50" :height="20"
          :rx="5" :ry="5"/>
        <circle class="station-point" v-d3-apply="drag.apply(vertex)"
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
  <circle class="indicator" v-if="drag.node" :r="15"
    :transform="svgu.translateOf(transform.apply([drag.target!.x, drag.target!.y]))"/>
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
  cursor: grab;
}

.station.dragged > .station-point {
  stroke: red;
  cursor: grabbing;
}

.indicator {
  fill: yellow;
  opacity: 0.5;
  cursor: grabbing;
}
</style>
