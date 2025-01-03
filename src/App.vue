<script setup lang="ts">
import InfoPanel from './components/InfoPanel.vue'

import resInfoIntro from '@/assets/html/intro.html?raw';
import resInfoFilter from '@/assets/html/filter.html?raw';
import resInfoParam from '@/assets/html/param.html?raw';
</script>

<template>
  <!-- 左侧栏 -->
  <InfoPanel id="left-panel">
    <div name="介绍"><div v-html="resInfoIntro"/></div>
    <div name="过滤器"><div v-html="resInfoFilter"/></div>
    <div name="参数"><div v-html="resInfoParam"/></div>
  </InfoPanel>
  <div id="map-view"/>
  <!-- 右侧栏 -->
  <div id="right-panel"></div>
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
