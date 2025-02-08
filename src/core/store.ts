import { computed, proxyRefs, shallowRef, watch } from 'vue';
import { defineStore } from 'pinia'
import { useAsyncState } from '@vueuse/core';
import { asSuccess } from './utils';
import { collectMapData, collectTrainGraph, routeDistance, routeDuration, type TrainGraph } from './data-adapter';
import { extractWeights, multiDijkstra, type PathEdge } from './graph/shortest-path';
import type { EdgeOf } from './graph/graph';


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
  /**
   * 警告后来者：不要试图把这个计算优化到后台。
   * 原因如下：
   * 1. 这段计算根本就不是耗时的主要来源。相信dijkstra，渲染地图和线路图的过程比这段计算耗时得多。
   * 2. 在JS中后台计算实在是太痛苦了。目前我们只能使用WebWorker，输入输出的数据必须经过深拷贝，而且不能传函数对象。这就是JS作为高层语言的代价。
   *    WebWorker把情况假设得太理想了，而这个计算真的没法做到那种程度的解耦，很难搬进去。我在尝试多种方案之后直接放弃了。
   */
  function shortestPath(weight: (edge: EdgeOf<TrainGraph>) => number) {
    return computed(() => {
      if (!graph.value) return null;
      return multiDijkstra(extractWeights(graph.value, weight));
    });
  }
  const distance = shortestPath(routeDistance);
  const duration = shortestPath(routeDuration);
  return { graph, distance, duration };
});

export type PathType = 'distance' | 'duration';
export const useSelectionStore = defineStore('selectionEdge', () => {
  const path = shallowRef({
    type: 'distance' as PathType,
    edge: null as PathEdge | null,
  });
  return { path };
});
