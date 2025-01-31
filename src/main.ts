import { createApp, shallowRef, type InjectionKey } from 'vue';
import App from './App.vue';
import type { TrainGraph } from '@/core/data-adapter';

const graph = shallowRef<TrainGraph | null>(null);
export let graphKey = Symbol() as InjectionKey<typeof graph>;

const app = createApp(App);
app.provide(graphKey, graph);
app.mount('#app');
