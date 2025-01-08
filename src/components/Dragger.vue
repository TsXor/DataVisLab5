<script setup lang="ts">
import { useEventListener } from '@vueuse/core';

const emit = defineEmits<{
  movement: [offset: { x: number, y: number }];
}>();

const mouse = { dragging: false };
useEventListener('mouseup', e => mouse.dragging = false);

useEventListener('mousemove', e => {
  if (mouse.dragging) {
    emit('movement', { x: e.movementX, y: e.movementY });
  }
});
</script>

<template>
  <div @mousedown.prevent="mouse.dragging = true"><slot/></div>
</template>
