<script setup lang="ts">
import type { data, render } from '@/core/dtypes';
import * as d3 from 'd3';
import { watch, type PropType } from 'vue';

const emit = defineEmits<{
  focusRegion: [bounds?: [[number, number], [number, number]]];
}>();

const { transform, projection } = defineProps({
  transform: { type: Object as PropType<d3.ZoomTransform>, required: true },
  projection: { type: Function as PropType<d3.GeoProjection>, required: true },
  map: { type: Object as PropType<render.MapData>, required: true },
});

const geoPath = $computed(() => d3.geoPath(projection));

// 此处必须为shallowRef，否则region会被递归转换，导致判等失效。
let focusedRegion = $shallowRef<data.Region | null>(null);
function isFocusedRegion(region: data.Region) { return focusedRegion === region; }
function toggleFocusedRegion(region: data.Region) { focusedRegion = focusedRegion === region ? null : region; }

// 在省份注意点转换时，执行缩放
watch($$(focusedRegion), region => emit('focusRegion', region ? geoPath.bounds(region) : undefined));
</script>

<template>
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
              @click.stop="toggleFocusedRegion(feat)">
              <title :text="feat.properties.name"/>
            </path>
          </template>
        </g>
      </g>
    </g>
  </g>
</template>

<style scoped>
.rough-border {
  fill: none;
  stroke: #aaa;
}

.precise-border {
  fill: rgba(128, 128, 128, 0.2);
  stroke: #444;
}

.precise-border.focused {
  fill: rgba(0, 0, 0, 0.2);
  transition: fill 250ms; /* d3的默认duration */
}
</style>
