<script setup lang="ts">
/**
 * 左侧信息栏，此部件与具体的信息内容解耦。
 */

import BaseSwitch from './BaseSwitch.vue';
import Dragger from './Dragger.vue';
import UseVNode from './UseVNode.vue';

const choice = defineModel({ type: Number, default: -1, });

let floatingWidth = $ref(visualViewport!.width * 40 / 100);
</script>

<template>
  <BaseSwitch v-model="choice" class="switch-container">
    <template #choice="{vnode, chosen}">
      <!-- 选项按钮 -->
      <button class="tab-button" :class="{chosen: chosen}" v-text="vnode.props!.name"/>
    </template>
    <template #item="{vnode}">
      <div style="position: relative; height: 100%">
        <!-- 第二层侧边栏 -->
        <div class="side-floating" :style="{ width: `${floatingWidth}px` }">
          <div class="info-container">
            <h2 class="info-title" v-text="vnode.props!.name"/>
            <div class="info-content"><UseVNode :vnode="vnode"/></div>
          </div>
          <!-- 拖拽控件 -->
          <Dragger class="dragger" @movement="e => floatingWidth += e.x"/>
        </div>
      </div>
    </template>
    <slot/>
  </BaseSwitch>
</template>

<style scoped>
.switch-container {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.side-floating {
  position: absolute;
  padding: 0px;
  display: flex;
  flex-direction: row;
  align-items: center;
  top: 2%;
  height: 96%;
  background-color: #f0f0f0;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
}

.info-container {
  height: 88%;
  padding: 6%;
  flex-grow: 1;
  overflow: scroll;
}

:deep(.choice-list) {
  background-color: #3a3a3a;
  border-right: 2px solid #ccc;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  width: 90px;
  height: 100%;
  padding: 20px 15px;
  gap: 15px;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}

.tab-button {
  background-color: #fff;
  border: 1px solid #ddd;
  font-size: 16px;
  width: 100%;
  aspect-ratio: 32/17;
  cursor: pointer;
}

.tab-button:hover {
  background-color: #93caf6;
  transition: background-color 0.2s;
}

.tab-button.chosen {
  background-color: #2196f3;
  color: white;
  transition: background-color 0.4s;
}

.dragger {
  width: 6px;
  height: 24px;
  margin: 6px;
  background-color: #3a3a3a;
  border-radius: 2px;
  cursor: ew-resize;
  flex-shrink: 0;
}
</style>
