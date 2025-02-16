<script setup lang="ts" generic="Range">
import type { RangeFilter } from '@/core/data-utils';
import useVuelidate from '@vuelidate/core';
import { numeric, or } from '@vuelidate/validators';
import { type PropType } from 'vue';

const emit = defineEmits<{
  edit: [data: RangeFilter];
}>();

const { filter } = defineProps({
  filter: { type: Object as PropType<RangeFilter>, required: true },
  caption: { type: String, required: true },
});

let filterMinEditing = $ref(false);
let filterMaxEditing = $ref(false);
let filterMinInput = $ref('');
let filterMaxInput = $ref('');

const emptyString = {
  $validator(s: unknown) { return s instanceof String && !s.trim().length; },
  $message: 'should be empty string'
};

const v$ = $(useVuelidate({
  filterMin: { valid: or(() => !filterMinEditing, emptyString, numeric) },
  filterMax: { valid: or(() => !filterMaxEditing, emptyString, numeric) },
}, { filterMin: $$(filterMinInput), filterMax: $$(filterMaxInput) }));

function startEdit(type: 'min' | 'max') {
  if (type === 'min') {
    filterMinInput = filter.min?.toString() ?? '';
    filterMinEditing = true;
  }
  if (type === 'max') {
    filterMaxInput = filter.max?.toString() ?? '';
    filterMaxEditing = true;
  }
}

function endEdit() {
  filterMinEditing = false;
  filterMaxEditing = false;
}

function submit() {
  if (v$.$pending || v$.$invalid) return;
  const editVal = (s: string) => {
    s = s.trim();
    return s.length ? Number(s) : undefined;
  }
  const data: RangeFilter = {};
  data.min = filterMinEditing ? editVal(filterMinInput) : filter.min;
  data.max = filterMaxEditing ? editVal(filterMaxInput) : filter.max;
  emit('edit', data);
  endEdit();
}
</script>

<template>
  <div>
    <span class="caption" v-text="caption"/>
    [
    <input v-if="filterMinEditing" class="value edit" :class="{ error: v$.filterMin.$invalid }"
      v-model="filterMinInput" :style="{ width: `${filterMinInput.length}ch` }"/>
    <span v-else class="value" v-text="filter.min ?? '<null>'" @click="startEdit('min')"/>
    ,
    <input v-if="filterMaxEditing" class="value edit" :class="{ error: v$.filterMax.$invalid }"
      v-model="filterMaxInput" :style="{ width: `${filterMaxInput.length}ch` }"/>
    <span v-else class="value" v-text="filter.max ?? '<null>'" @click="startEdit('max')"/>
    ]
    <div class="edit-control" v-if="filterMinEditing || filterMaxEditing">
      <button class="applier" :class="{ unavailable: v$.$pending || v$.$invalid }" v-text="'应用'" @click="submit()"/>
      <button class="canceller" v-text="'取消'" @click="endEdit()"/>
    </div>
  </div>
</template>

<style scoped>
.caption {
  font-size: large;
}

.edit-control, .value {
  display: inline-block;
}

.applier, .canceller {
  margin-left: 2px;
}

.applier.unavailable {
  background-color: pink;
  cursor: not-allowed;
}

.value.error {
  border-color: red;
}
</style>
