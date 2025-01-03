<script setup lang="ts">
import { reactive, ref, useTemplateRef, watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import BaseSwitch from './BaseSwitch.vue';
import UseVNode from './UseVNode.vue';

const choice = defineModel({ type: Number, default: -1, });

const dragger = useTemplateRef('dragger');

const mouseState = reactive({
  x: 0, y: 0,
  isDragging: false,
});
useEventListener('mouseup', e => mouseState.isDragging = false);
useEventListener('mousemove', e => { mouseState.x = e.pageX; mouseState.y = e.pageY; });

const floatingWidth = ref(visualViewport!.width * 40 / 100);
watch(mouseState, state => {
  if (state.isDragging) {
    const draggerRect = dragger.value!.getBoundingClientRect();
    const draggerCenter = (draggerRect.left + draggerRect.right) / 2;
    floatingWidth.value += state.x! - draggerCenter;
  }
});
</script>

<template>
  <BaseSwitch v-model="choice" class="switch-container">
    <template #choice="{vnode, chosen}">
      <!-- 选项按钮 -->
      <button class="tab-button" :class="{chosen: chosen}">{{ vnode.props!.name }}</button>
    </template>
    <template #item="{vnode}">
      <!-- 第二层侧边栏 -->
      <div class="side-floating" :style="{ width: `${floatingWidth}px` }">
        <div class="info-container">
          <h2 class="info-title">{{ vnode.props!.name }}</h2>
          <div class="info-content"><UseVNode :vnode="vnode"/></div>
        </div>
        <!-- 拖拽控件 -->
        <div class="dragger" ref="dragger"
          @mousedown.prevent="mouseState.isDragging = true"
        />
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
  text-align: center;
  width: 100px;
  height: 100%;
  padding: 10px;
}

.tab-button {
  background-color: #fff;
  border: 1px solid #ddd;
  font-size: 16px;
  margin: 5px;
  padding: 10px;
  width: 80%;
  text-align: middle;
  cursor: pointer;
}

.tab-button.chosen {
  background-color: #2196f3;
  color: white;
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
