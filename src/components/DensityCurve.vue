<script setup lang="ts">
import * as d3 from 'd3';
import type { PropType } from 'vue';
import { v, vD3Render } from '@/vueshim/d3v';
import type { PathGraph } from '@/core/graph/shortest-path';
import type { ElementOf } from '@vueuse/core';
import { svgu } from '@/vueshim/utils';


// 是的，想想线代！
const mirrorY = svgu.matrix(1, 0, 0, -1, 0, 0);

function generatePachinkoStack(distance: number, xs: Iterable<number>) {
  const radius2 = distance ** 2;
  const bisect = d3.bisector<svgu.PointXY, number>(d => d.x);
  const circles = [] as svgu.PointXY[];
  // 哦我的天哪，下面这段代码的复杂度达到了劲爆的O(E^2)！
  for (const x of xs) {
    const l = bisect.left(circles, x - distance);
    const r = bisect.right(circles, x + distance, l);
    let y = distance / 2;
    const check = () => {
      for (let i = l; i < r; ++i) {
        const { x: xi, y: yi } = circles[i];
        const x2 = (xi - x) ** 2, y2 = (yi - y) ** 2;
        if (x2 + y2 < radius2) {
          y = yi + Math.sqrt(radius2 - x2) + 1e-6;
          return false;
        }
      }
      return true;
    }
    while (!check()) {}
    circles.splice(bisect.left(circles, x, l, r), 0, { x, y });
  }
  return circles;
}

function* generateTidyStack(distance: number, count: number, width: number, height: number) {
  const nc = Math.floor(width / distance); // Balls per row
  const nr = Math.floor(height / distance); // Max rows
  let got = 0;
  for (let j = 0; j < nr; ++j) {
    for (let i = 0; i < nc; ++i) {
      yield { x: distance * (i + 0.5), y: distance * (j + 0.5) } as svgu.PointXY;
      got += 1; if (got >= count) return;
    }
  }
}

const { graph, viewSize, numberSize, labelSize, ballSize, infinityStackWidth } = defineProps({
  graph: { type: Object as PropType<PathGraph>, required: true },
  viewSize: { type: Object as PropType<[number, number]>, default: [800, 500] },
  numberSize: { type: Object as PropType<[number, number]>, default: [40, 10] },
  labelSize: { type: Object as PropType<[number, number]>, default: [50, 40] },
  ballSize: { type: Number, default: 1 },
  infinityStackWidth: { type: Number, default: 60 },
});

const viewBox = $computed(() => {
  const [width, height] = viewSize;
  return svgu.viewbox(0, 0, width, height);
});

const size = $computed(() => {
  const [viewW, viewH] = viewSize;
  const [numberW, numberH] = numberSize;
  const [labelW, labelH] = labelSize;
  const padding = 4;
  const width = viewW - numberW - labelW - infinityStackWidth - padding * 3;
  const height = viewH - numberH - labelH - padding * 2;
  const origin = { x: numberW + padding, y: labelH + height };
  const infStack = { x: origin.x + width + padding, y: origin.y };
  const xLabel = { x: 0, y: labelH };
  const yLabel = { x: viewW - labelW, y: viewH };
  const infLabel = { x: infStack.x + infinityStackWidth / 2, y: infStack.y + padding };
  return { width, height, origin, infStack, xLabel, yLabel, infLabel };
});

/**
 * 注：js中没有生成器推导式，但可以用一个生成器IIFE代替。
 * 具体地说，py中的`(i + 1 for i in arr)`可以写成下面的形式：
 * `(function* () { for (const i of arr) yield i + 1; })()`
 * 下面将出现几次这个用法。
 */;

const data = $computed(() => {
  const weights = Array.from((function* () {
    for (const edge of graph.outOrderEdges()) {
      if (!edge.isSelfLoop()) yield edge.data.weight;
    }
  })());
  const weightExtent = d3.extent(weights) as [number, number];
  const hist = d3.histogram().domain(weightExtent)
    .thresholds(d3.ticks(weightExtent[0], weightExtent[1], 40));
  const density = hist(weights).map(bin => ({
    x0: bin.x0!, x1: bin.x1!,
    density: bin.length / weights.length / (bin.x1! - bin.x0!),
  }));
  const densityExtent = d3.extent(density, d => d.density) as [number, number];
  const infinityCount = graph.vertices.size ** 2 - weights.length;
  return { weights, weightExtent, density, densityExtent, infinityCount };
});

const ui = $computed(() => {
  const x = d3.scaleLinear(data.weightExtent, [0, size.width]);
  const y = d3.scaleLinear(data.densityExtent, [size.height, 0]);
  const line = d3.line<ElementOf<typeof data.density>>()
    .x((d) => x((d.x0 + d.x1) / 2))
    .y((d) => y(d.density))
    .curve(d3.curveBasis);
  return { x, y, line };
});

const pachinkoPoints = $computed(() => generatePachinkoStack(
  ballSize * 2 + 1, (function* () { for (const w of data.weights) yield ui.x(w); })()
));
const infinityPoints = $computed(() => Array.from(generateTidyStack(
  ballSize * 2 + 1, data.infinityCount, infinityStackWidth, size.height
)));
</script>

<template>
  <svg :viewBox="viewBox">
    <g>
      <g class="curve" :transform="svgu.translateOf(size.origin)">
        <g class="x-axis" :transform="svgu.translate(0, 0)" 
          v-d3-render="v.withTransition(d3.axisBottom(ui.x).tickSizeOuter(0), t => t.duration(1000))"/>
        <g class="y-axis" :transform="svgu.translate(0, -size.height)"
          v-d3-render="v.withTransition(d3.axisLeft(ui.y).tickSizeOuter(0), t => t.duration(1000))"/>
        <path :transform="svgu.translate(0, -size.height)" :d="ui.line(data.density)!"/>
      </g>
      <text class="x-axis-label" font-size="12px" :transform="svgu.translateOf(size.xLabel)">
        <tspan x="0" dy="-15" v-text="'客流密度'"/>
        <tspan x="0" dy="12" v-text="'/(万人/km)'"/>
      </text>
      <text class="y-axis-label" font-size="12px" :transform="svgu.translateOf(size.yLabel)">
        <tspan x="0" dy="-15" v-text="'里程数'"/>
        <tspan x="0" dy="12" v-text="'/km'"/>
      </text>
      <text class="infinity-label" font-size="10px" :transform="svgu.translateOf(size.infLabel)">
        <tspan x="0" dy="12" text-anchor="middle" v-text="'Infinity'"/>
      </text>
      <g class="balls">
        <g class="pachinko-balls" :transform="[svgu.translateOf(size.origin), mirrorY].join(' ')">
          <circle v-for="point in pachinkoPoints" :cx="point.x" :cy="point.y" :r="ballSize"/>
        </g>
        <g class="infinity-balls" :transform="[svgu.translateOf(size.infStack), mirrorY].join(' ')">
          <circle v-for="point in infinityPoints" :cx="point.x" :cy="point.y" :r="ballSize"/>
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
svg {
  max-width: 100%;
  height: auto;
  margin: 20px;
}

.curve > path {
  fill: none;
  stroke: steelblue;
  stroke-width: 2;
}
</style>
