<script setup lang="ts">
import * as d3 from 'd3';
import { type PropType } from 'vue';
import { svgu } from '@/vueshim/utils';
import BaseLegend from './BaseLegend.vue';


defineSlots<{
  'icon-left'(props: { size: number }): any,
  'icon-right'(props: { size: number }): any,
}>();

const props = defineProps({
  scaler: { type: Function as PropType<d3.ScaleLinear<number, number>>, required: true },
  iconWidth: { type: Number, required: true },
  iconHeight: { type: Number, required: true },
  barWidth: { type: Number, default: 160 },
  barHeight: { type: Number, default: 15 },
  chooserSize: { type: Number, default: 5 },
  caption: { type: String, required: true },
});

const barHeightScale = $computed(() => {
  const [min, max] = props.scaler.range();
  return d3.scaleLinear([0, max], [0, props.barHeight]);
});

const barPoints = $computed(() => {
  const [min, max] = props.scaler.range();
  const barLeft = barHeightScale(min);
  return [
    [0, props.barHeight - barLeft], // 左上角
    [props.barWidth, 0], // 右上角
    [props.barWidth, props.barHeight], // 右下角
    [0, props.barHeight], // 左下角
  ] as svgu.Point[];
});
</script>

<template>
  <BaseLegend v-bind="props">
    <template #bar>
      <polygon class="bar" :points="svgu.points(barPoints)"/>
    </template>
    <template #icon-left="{ min }">
      <slot name="icon-left" :size="min"/>
    </template>
    <template #icon-right="{ max }">
      <slot name="icon-left" :size="max"/>
    </template>
  </BaseLegend>
</template>

<style scoped>
:deep(.bar) {
  fill: #ffd;
  stroke: #000;
}
</style>
