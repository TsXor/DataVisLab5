import { computed, proxyRefs, shallowRef, watch } from 'vue';
import { defineStore } from 'pinia'
import { useAsyncState } from '@vueuse/core';
import { asSuccess } from './utils';
import { collectMapData, collectTrainGraph, type TrainGraph } from './data-adapter';


export const useRemoteDataStore = defineStore('remoteData', () => {
  const map = proxyRefs(useAsyncState(collectMapData(), null));
  const graph = proxyRefs(useAsyncState(collectTrainGraph(), null));
  const isReady = computed(() =>
    graph.isReady && map.isReady &&
    graph.state!.success && map.state!.success
  );
  return { map, graph, isReady };
});

export const useGraphStore = defineStore('graph', () => {
  const baseData = useRemoteDataStore();
  const graph = shallowRef<TrainGraph | null>(null);
  watch(() => baseData.isReady, ready => {
    if (ready) { graph.value = asSuccess(baseData.graph.state!); }
  });
  return { graph };
});
