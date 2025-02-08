<script setup lang="ts">
import * as d3 from 'd3';
import { useId, watch, type PropType } from 'vue';
import { walkPathVertices, type PathEdge, type PathGraph } from '@/core/graph/shortest-path';
import type { ElementOf } from '@vueuse/core';
import { calcTextbox, svgu } from '@/vueshim/utils';
import { d3u, vD3Render, vD3Raise } from '@/vueshim/d3v';


const { graph, legendSize, labelWidth, gridSize } = defineProps({
  graph: { type: Object as PropType<PathGraph>, required: true },
  legendSize: { type: Object as PropType<[number, number]>, default: [600, 30] },
  labelWidth: { type: Number, default: 40 },
  gridSize: { type: Number, default: 15 },
});

const data = $computed(() => {
  const max = d3.max(graph.outOrderEdges(), e => e.data.weight)!;
  const color = d3.scaleSequential([0, max], d3.interpolateReds);
  return { max, color };
});

const ui = $computed(() => {
  // 哦不！它们暂时是写死的...
  const textHeight = 30, gridPadding = 1.5;

  // 计算参考轴数据
  const [legendW, legendH] = legendSize;
  const legend = {
    text: { x: labelWidth, y: textHeight },
    bar: { x: labelWidth, y: textHeight },
    axis: { x: labelWidth, y: legendH + textHeight },
    scale: d3.scaleLinear([0, data.max], [0, legendW]),
    infinityBlock: { x: labelWidth + legendW + legendH, y: textHeight },
    infinityText: { x: labelWidth + legendW + 1.5 * legendH, y: legendH + 1.5 * textHeight },
  };

  // 计算各项位置
  const gridTotal = graph.vertices.size * (gridSize + gridPadding) - gridPadding;
  const origin = { x: labelWidth, y: legendH + 2 * textHeight };
  const width = origin.x + d3.max([legendW + 2 * legendH, gridTotal])!;
  const height = origin.y + gridTotal + textHeight;

  // 计算格点位置
  const vertices = Array.from(graph.vertices.values());
  const names = vertices.map(v => v.id as string);
  const band = d3.scaleBand(names, [0, gridTotal]).round(false)
    .paddingInner(gridPadding / gridTotal).paddingOuter(gridSize / 2 / gridTotal);
  const grids = vertices.flatMap((source, iy) => {
    const y = iy * (gridSize + gridPadding);
    return vertices.map((target, ix) => {
      const x = ix * (gridSize + gridPadding);
      return { x, y, edge: source.out.get(target) };
    });
  });

  return { width, height, legend, origin, band, grids, gridTotal };
});

type Grid = ElementOf<typeof ui.grids>;
let hovered = $shallowRef<Grid | null>(null);
let chosen = $(defineModel<PathEdge | null>('chosenEdge', { default: null }));
function toggleChosen(grid: Grid) { chosen = chosen === grid.edge ? null : (grid.edge ?? null); }

const infoDialog = $computed(() => {
  if (!hovered) return null;
  // 哦不！它们暂时是写死的...
  const padding = { x: 10, y: 10 }, textSize = 12, lineHeight = 16;

  // 计算信息框内容和所需宽高
  const lineName = hovered.edge ? `${hovered.edge.source.id}-${hovered.edge.target.id}` : 'N/A';
  const distanceExpr = hovered.edge ? `${hovered.edge.data.weight.toFixed(1)} km` : '∞';
  const traceNames = hovered.edge ? Array.from(walkPathVertices(hovered.edge)).map(v => v.id as string) : [];
  const { width: textW, height: textH, truncLines } = calcTextbox([
    `线路: ${lineName}`,
    `里程: ${distanceExpr}`,
    `途经：${traceNames.length ? traceNames.join(' ') : '无'}`,
  ], textSize, lineHeight, Math.floor(ui.gridTotal / 2 / textSize));
  const width = textW + 2 * padding.x, height = textH + 2 * padding.y;

  // 计算信息框的XY坐标，优先悬浮在右侧，空间不够时调整位置。
  let x = ui.origin.x + hovered.x, y = ui.origin.y + hovered.y;
  if (ui.gridTotal - hovered.x - gridSize * 1.5 > width) x += gridSize * 1.5;
  else x -= width + gridSize * 0.5;
  if (ui.gridTotal - hovered.y > height) y += 0;
  else y -= height - gridSize;

  return {
    width, height, x, y, padding, textSize, lineHeight,
    edge: hovered.edge, lines: truncLines,
  };
});

const viewBox = $computed(() => {
  const {width, height} = ui;
  return svgu.viewbox(0, 0, width, height);
});

const legendGradientId = useId();
</script>

<template>
  <svg :viewBox="viewBox">
    <g class="axis" :transform="svgu.translateOf(ui.origin)" v-d3-render="d3.axisLeft(ui.band)"/>
    <g class="cells" :transform="svgu.translateOf(ui.origin)">
      <g v-for="grid in ui.grids" :transform="svgu.translateOf(grid)" v-d3-raise="hovered === grid"
        v-memo="[chosen === grid.edge, hovered === grid]">
        <rect v-if="grid.edge" class="cell" :width="gridSize" :height="gridSize"
          :class="{ chosen: chosen === grid.edge, hovered: hovered === grid }"
          :transform="svgu.scaleOrigin(gridSize / 2, gridSize / 2, hovered === grid ? 2 : 1)"
          :fill="data.color(grid.edge.data.weight)" @click.stop="toggleChosen(grid)"
          @mouseover.stop="hovered = grid" @mouseout.stop="hovered = null"/>
        <rect v-else class="cell-empty" :width="gridSize" :height="gridSize"/>
      </g>
    </g>
    <g class="cell-info" v-if="infoDialog" :transform="svgu.translateOf(infoDialog)">
      <rect :width="infoDialog.width" :height="infoDialog.height"/>
      <text :transform="svgu.translateOf(infoDialog.padding)"
        v-d3-render="d3u.textLines(infoDialog.lines, infoDialog.textSize, infoDialog.lineHeight)"/>
    </g>
    <g class="legend">
      <defs v-d3-render="d3u.rampGradientX(legendGradientId, data.color.interpolator(), 16)"/>
      <text class="label" :transform="svgu.translateOf(ui.legend.text)" v-text="'颜色映射：里程数（单位：千米）'"
        font-size="18" dy="-6"/>
      <rect :transform="svgu.translateOf(ui.legend.bar)" :fill="svgu.urlId(legendGradientId)"
        :width="legendSize[0]" :height="legendSize[1]"/>
      <g :transform="svgu.translateOf(ui.legend.axis)" v-d3-render="d3.axisBottom(ui.legend.scale).ticks(5)"/>
      <rect :transform="svgu.translateOf(ui.legend.infinityBlock)" fill="black"
        :width="legendSize[1]" :height="legendSize[1]"/>
      <text class="inf-label" :transform="svgu.translateOf(ui.legend.infinityText)" v-text="'∞'"
        font-size="18" text-anchor="middle"/>
    </g>
  </svg>
</template>

<style scoped>
.cell {
  stroke: none;
  transition-property: transform;
  transition-duration: 200ms;
}

.cell.chosen {
  stroke: blue;
  stroke-width: 2px;
}

.cell-empty {
  fill: black;
}

.cell-info > rect {
  fill: wheat;
}

.legend > .label {
  font-weight: bold;
  text-anchor: start;
}
</style>
