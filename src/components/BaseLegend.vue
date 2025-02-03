<script setup lang="ts" generic="Range">
import * as d3 from 'd3';
import { watch, type PropType } from 'vue';
import { v, vD3Bind, vD3Render } from '@/vueshim/d3v';
import { clamp } from '@vueuse/core';
import { svgPoints, type Point, type Points } from '@/vueshim/utils';

defineSlots<{
  'icon-left'(props: { min: Range }): any,
  'icon-right'(props: { max: Range }): any,
  bar(props: {}): any,
}>();

const { scaler, barWidth, chooserSize } = defineProps({
  scaler: { type: Function as PropType<d3.ScaleLinear<Range, Range>>, required: true },
  iconWidth: { type: Number, required: true },
  iconHeight: { type: Number, required: true },
  barWidth: { type: Number, required: true },
  barHeight: { type: Number, required: true },
  chooserSize: { type: Number, required: true },
  caption: { type: String, required: true },
});

const captionHeight = 10;
const axisScale = $computed(() => d3.scaleLinear(scaler.domain(), [0, barWidth]));

const chooserPoints = [[0, 1], [0, -1], [-1, 0], [-1, 1]] as Points;
const leftChooserPoints = $computed(() => chooserPoints.map(([x, y]) => [x * chooserSize, y * chooserSize] as Point));
const rightChooserPoints = $computed(() => leftChooserPoints.map(([x, y]) => [-x, y] as Point));

let filterMin = $(defineModel<number>('filterMin', { default: NaN }));
let filterMax = $(defineModel<number>('filterMax', { default: NaN }));
watch(() => scaler, () => { const [min, max] = scaler.domain(); filterMin = min; filterMax = max; }, { immediate: true });

const leftX = $computed({
  get: () => axisScale(filterMin!),
  set: x => { filterMin = clamp(axisScale.invert(x), scaler.domain()[0], filterMax); }
});
const rightX = $computed({
  get: () => axisScale(filterMax!),
  set: x => { filterMax = clamp(axisScale.invert(x), filterMin, scaler.domain()[1]); }
});
const leftDrag = new v.Drag().attachPos({ x: $$(leftX) });
const rightDrag = new v.Drag().attachPos({ x: $$(rightX) });
</script>

<template>
  <g>
    <g :transform="`translate(0, ${captionHeight})`">
      <g :transform="`translate(0, 0)`">
        <slot name="icon-left" :min="scaler.range()[0]"/>
      </g>
      <g :transform="`translate(${iconWidth + barWidth}, 0)`">
        <slot name="icon-right" :max="scaler.range()[1]"/>
      </g>
      <g :transform="`translate(${iconWidth}, ${d3.max([(iconHeight - barHeight) / 2, 0])!})`">
        <slot name="bar" class="bar"/>
        <g :transform="`translate(0, ${barHeight})`">
          <g class="axis" v-d3-render="d3.axisBottom(axisScale).ticks(5)"/>
          <line class="selected" :x1="leftX" :x2="rightX" y1="0" y2="0"/>
          <polygon class="chooser" :points="svgPoints(leftChooserPoints)"
            :transform="`translate(${leftX}, 0)`" v-d3-bind="leftDrag" />
          <polygon class="chooser" :points="svgPoints(rightChooserPoints)"
            :transform="`translate(${rightX}, 0)`" v-d3-bind="rightDrag"/>
        </g>
      </g>
    </g>
    <text class="caption" x="0" y="0" v-text="caption"/>
  </g>
</template>

<style scoped>
.chooser {
  fill: white;
  stroke: black;
}

.selected {
  stroke: red;
  stroke-width: 2px;
}

.caption {
  font-size: 8px;
  font-weight: bold;
}

.axis :deep(text) {
  font-size: 6px;
  cursor: pointer;
}
</style>
