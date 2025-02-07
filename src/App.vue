<script setup lang="ts">
import InfoPanel from './components/InfoPanel.vue'
import VisualPanel from './components/VisualPanel.vue';
import DataSuspense from './components/DataSuspense.vue';
import MapView from './components/MapView.vue';
import GraphView from './components/GraphView.vue';
import MultiDensityCurve from './components/MultiDensityCurve.vue';

import resInfoIntro from '@/assets/html/intro.html?raw';
import resInfoFilter from '@/assets/html/filter.html?raw';
import resInfoParam from '@/assets/html/param.html?raw';
import resIconDensityCurve from '@/assets/img/densitycurve.png'
import resIconHeatmap from '@/assets/img/heatmap.png'
</script>

<template>
  <!-- 左侧栏 -->
  <InfoPanel id="left-panel">
    <div name="介绍"><div v-html="resInfoIntro"/></div>
    <div name="过滤器"><div v-html="resInfoFilter"/></div>
    <div name="参数"><div v-html="resInfoParam"/></div>
  </InfoPanel>
  <DataSuspense id="map-view" v-slot="{ graph, map }">
    <MapView :map="map" v-slot="{ transform, projection }">
      <GraphView :graph="graph" :transform="transform" :projection="projection"/>
    </MapView>
  </DataSuspense>
  <!-- 右侧栏 -->
  <VisualPanel id="right-panel">
    <div :icon="resIconDensityCurve">
      <MultiDensityCurve/>
    </div>
    <div :icon="resIconHeatmap"></div>
  </VisualPanel>
</template>

<style>
#app {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

#left-panel {
  flex-shrink: 0;
}

#right-panel {
  flex-shrink: 0;
}

#map-view {
  flex-grow: 1;
}
</style>
