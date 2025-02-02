<script setup lang="ts">
import * as d3 from 'd3';
import { useId, type PropType } from 'vue';
import BaseLegend from './BaseLegend.vue';


defineSlots<{
  'icon-left'(props: { color: string }): any,
  'icon-right'(props: { color: string }): any,
}>();

const props = defineProps({
  scaler: { type: Function as PropType<d3.ScaleLinear<string, string>>, required: true },
  iconWidth: { type: Number, required: true },
  iconHeight: { type: Number, required: true },
  barWidth: { type: Number, default: 160 },
  barHeight: { type: Number, default: 10 },
  chooserSize: { type: Number, default: 5 },
  caption: { type: String, required: true },
});

const colorGradientId = useId();
</script>

<template>
  <BaseLegend v-bind="props">
    <template #bar>
      <defs>
        <linearGradient :id="colorGradientId" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" :stop-color="scaler.range()[0]"/>
          <stop offset="100%" :stop-color="scaler.range()[1]"/>
        </linearGradient>
      </defs>
      <rect class="bar" :width="barWidth" :height="barHeight" :fill="`url(#${colorGradientId})`"/>
    </template>
    <template #icon-left="{ min }">
      <slot name="icon-left" :color="min"/>
    </template>
    <template #icon-right="{ max }">
      <slot name="icon-right" :color="max"/>
    </template>
  </BaseLegend>
</template>

<style scoped>

</style>
