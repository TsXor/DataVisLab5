<script setup lang="ts">
/**
 * 右侧小部件栏，此部件与具体的子部件解耦。
 */

import BaseSwitch from './BaseSwitch.vue';
import UseVNode from './UseVNode.vue';

const choice = defineModel({ type: Number, default: -1, });
</script>

<template>
  <BaseSwitch v-model="choice" class="switch-container">
    <template #choice="{vnode, chosen}">
      <!-- 选项按钮 -->
      <img class="tab-icon" :class="{chosen: chosen}" :src="vnode.props!.icon"/>
    </template>
    <template #item="{vnode}">
      <Teleport to="#map-view">
        <div style="position: relative; width: 100%">
          <!-- 第二层侧边栏 -->
          <div class="popup-floating">
            <button class="closer" @click="choice = -1">×</button>
            <div class="widget-container"><UseVNode :vnode="vnode"/></div>
          </div>
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

.closer {
  position: absolute;
  right: 10px;
  top: 10px;
  padding: 4px;
  border: none;
  border-radius: 5px;
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
