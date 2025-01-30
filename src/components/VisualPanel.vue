<script setup lang="ts">
/**
 * 右侧小部件栏，此部件与具体的子部件解耦。
 */

import BaseSwitch from './BaseSwitch.vue';
import Dragger from './Dragger.vue';
import UseVNode from './UseVNode.vue';

import resIconMove from '@/assets/img/move.svg'
import resIconResize from '@/assets/img/resize.svg'

const choice = defineModel({ type: Number, default: -1, });

const floating = $ref({
  width: visualViewport!.width * 50 / 100,
  height: visualViewport!.height * 75 / 100,
  cx: visualViewport!.width / 2,
  cy: visualViewport!.height / 2,
  resize: (x: number, y: number) => {
    floating.width += x;
    floating.height += y;
  },
  move: (x: number, y: number) => {
    floating.cx += x;
    floating.cy += y;
  },
  toStyle: () => ({
    width: `${floating.width}px`,
    height: `${floating.height}px`,
    left: `${floating.cx - floating.width / 2}px`,
    top: `${floating.cy - floating.height / 2}px`,
  })
});
</script>

<template>
  <BaseSwitch v-model="choice" class="switch-container">
    <template #choice="{vnode, chosen}">
      <!-- 选项按钮 -->
      <img class="tab-icon" :class="{chosen: chosen}" :src="vnode.props!.icon"/>
    </template>
    <template #item="{vnode}">
      <Teleport to="body">
        <!-- 第二层侧边栏 -->
        <div class="popup-floating" :style="floating.toStyle()">
          <div class="control-bar">
            <Dragger class="resizer" @movement="e => { floating.resize(-e.x, -e.y); floating.move(e.x / 2, e.y / 2); }"><img :src="resIconResize"/></Dragger>
            <Dragger class="mover" @movement="e => { floating.move(e.x, e.y); }"><img :src="resIconMove"/></Dragger>
            <button class="closer" @click="choice = -1">×</button>
          </div>
          <div class="widget-container"><UseVNode :vnode="vnode"/></div>
        </div>
      </Teleport>
    </template>
    <slot/>
  </BaseSwitch>
</template>

<style scoped>
.switch-container {
  height: 100%;
}

.popup-floating {
  position: absolute;
  left: 5%;
  width: 90%;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border: 1px solid #ddd;
  top: 50px;
  z-index: 10;
  border-radius: 10px;
}

.widget-container {
  padding: 10px;
  height: 100%;
  overflow-y: scroll;
  opacity: 1;
}

.control-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.closer {
  margin: 10px;
  padding: 4px;
  border: none;
  border-radius: 5px;
  user-select: none;
  cursor: pointer;
}

.mover {
  margin: 10px;
  width: 20px;
  height: 20px;
  user-select: none;
  cursor: pointer;
}

.resizer {
  margin: 10px;
  width: 20px;
  height: 20px;
  user-select: none;
  cursor: pointer;
}

:deep(.choice-list) {
  background-color: #3a3a3a;

  width: 90px;
  height: 100%;
  padding: 20px 15px;
  gap: 15px;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}

.tab-icon {
  border-radius: 50%;
  width: 100%;
  aspect-ratio: 1;
  cursor: pointer;
}

:deep(.choice-item) {
  padding: 10%;
  border-radius: 5%;
}

:deep(.choice-item:hover) {
  background-color: #656565;
  transition: background-color 0.2s;
}

:deep(.choice-item.chosen) {
  background-color: #b4b4b4;
  transition: background-color 0.4s;
}
</style>
