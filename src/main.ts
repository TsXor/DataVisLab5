import { createApp, type InjectionKey } from 'vue';
import { useAsyncState } from '@vueuse/core';
import App from './App.vue';
import { collectMapData, collectTrainGraph } from './core/data-adapter';

const mapAsync = useAsyncState(collectMapData(), null);
export let mapKey = Symbol() as InjectionKey<typeof mapAsync>;
const graphAsync = useAsyncState(collectTrainGraph(), null);
export let graphKey = Symbol() as InjectionKey<typeof graphAsync>;

const app = createApp(App);
app.provide(graphKey, graphAsync);
app.provide(mapKey, mapAsync);
app.mount('#app');
