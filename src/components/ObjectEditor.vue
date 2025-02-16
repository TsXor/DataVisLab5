<script setup lang="tsx">
import { testJSON, type ObjectChange, type ObjectPath } from '@/core/utils';
import { clsx } from '@nberlette/clsx';
import { reactive, type PropType } from 'vue';

const emit = defineEmits<{
  submit: [changes: ObjectChange[]];
}>();

const { target, freeze, caption, indent } = defineProps({
  target: { type: Object, required: true },
  freeze: { type: Object as PropType<Iterable<ObjectPath>>, default: [] },
  caption: { type: String, required: true },
  indent: { type: Number, default: 20 },
});

const frozenId = $computed(() => new Set((function* () {
  for (const path of freeze) { yield JSON.stringify(path); }
})()));

type ChangeEntry = { path: ObjectPath, value: string, valid: boolean };
const changes = reactive(new Map<string, ChangeEntry>());
const valid = $computed(() => {
  for (const change of changes.values()) { if (!change.valid) return false; }
  return true;
});

function submit() {
  const exportChanges = Array.from((function* () {
    for (const change of changes.values())
      yield { path: change.path, value: JSON.parse(change.value) };
  })());
  emit('submit', exportChanges);
  changes.clear();
}

function leaf(obj: any, path: ObjectPath) {
  const id = JSON.stringify(path);
  const lastKey = path[path.length - 1];
  const indentStyle = { 'margin-left': `${indent}px` };
  return <div class='object-leaf'>
    <label class="key">{ typeof lastKey === 'number' ? `[${lastKey}]` : lastKey }</label>
    { (function () {
      if (obj instanceof Array) {
        return <div style={ indentStyle }>{ obj.map((v, i) => leaf(v, [...path, i])) }</div>;
      } else if (obj instanceof Object) {
        return <div style={ indentStyle }>{ Object.entries(obj).map(([k, v]) => leaf(v, [...path, k])) }</div>;
      } else {
        const repr = JSON.stringify(obj);
        const classes = ['object-field'];
        const change = changes.get(id);
        if (change) {
          classes.push('changed');
          if (!change.valid) { classes.push('invalid'); }
        }
        return <input class={clsx(classes)} disabled={ frozenId.has(id) } value={ change?.value ?? repr }
          onChange={ e => {
            const value = (e.target as HTMLInputElement).value;
            const change = changes.get(id);
            if (change && value === repr) { changes.delete(id); }
            else { changes.set(id, { path, value, valid: testJSON(value) }); }
          } }/>
      }
    })() }
  </div>;
}

defineRender(() => {
  return <div>
    <label class="caption">{ caption }</label>
    <button class="submitter" disabled={ !changes.size || !valid }
      onClick={ submit }>修改</button>
    <div>{ Object.entries(target).map(([k, v]) => leaf(v, [k])) }</div>
  </div>
});
</script>

<style scoped>
.key {
  font-family: "Lucida Console", "Courier New", monospace;
}

.submitter {
  margin-left: 4px;
}

.object-leaf {
  border: 1px solid black;
  padding: 4px;
}

.object-field {
  margin-left: 4px;
}

.object-field.changed {
  background-color: yellowgreen;
}

.object-field.changed.invalid {
  background-color: palevioletred;
}
</style>
