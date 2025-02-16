<script setup lang="ts">
import InfoPanel from './components/InfoPanel.vue'
import VisualPanel from './components/VisualPanel.vue';
import MultiGraph from './components/MultiGraph.vue';
import MultiDensityCurve from './components/MultiDensityCurve.vue';
import MultiHeatMap from './components/MultiHeatMap.vue';
import FilterExplorer from './components/FilterExplorer.vue';
import ParamExplorer from './components/ParamExplorer.vue';
import Intro from './components/Intro.vue';

import resIconDensityCurve from '@/assets/img/densitycurve.png'
import resIconHeatmap from '@/assets/img/heatmap.png'
</script>

<template>
  <!-- 左侧栏 -->
  <InfoPanel id="left-panel">
    <div name="介绍">
      <Intro/>
    </div>
    <div name="过滤器">
      <FilterExplorer/>
    </div>
    <div name="参数">
      <ParamExplorer/>
    </div>
  </InfoPanel>
  <MultiGraph id="graph-view"/>
  <!-- 右侧栏 -->
  <VisualPanel id="right-panel">
    <div :icon="resIconDensityCurve">
      <MultiDensityCurve/>
    </div>
    <div :icon="resIconHeatmap">
      <MultiHeatMap/>
    </div>
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

#graph-view {
  flex-grow: 1;
}
</style>
