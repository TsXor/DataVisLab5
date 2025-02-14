import { computed, shallowRef, watch } from 'vue';
import { defineStore } from 'pinia'
import { useAsyncState } from '@vueuse/core';
import { asSuccess } from './utils';
import { collectMapData, collectTrainGraph, type TrainGraph } from './data-adapter';
import { graphExtents, routeDistance, routeDuration } from './data-utils';
import { extractWeights, multiDijkstra, walkPathEdges, type PathEdge } from './graph/shortest-path';
import type { EdgeOf } from './graph/graph';


export const useRemoteDataStore = defineStore('remoteData', () => {
  const map = useAsyncState(collectMapData(), null);
  const graph = useAsyncState(collectTrainGraph(), null);
  const isReady = computed(() => Boolean(
    graph.isReady && map.isReady &&
    graph.state.value?.success && map.state.value?.success
  ));
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
  const extents = computed(() => graph.value ? graphExtents(graph.value) : null);
  const isReady = computed(() => Boolean(graph.value && extents.value));
  return { graph, distance, duration, extents, isReady };
});

export type PathType = 'distance' | 'duration';
export const useSelectionStore = defineStore('selection', () => {
  const path = shallowRef({
    type: 'distance' as PathType,
    edge: null as PathEdge | null,
  });
  const graph = useGraphStore();
  const pathEdges = computed(() => {
    const edge = path.value.edge;
    if (!edge || !graph.graph)
      return new Map<EdgeOf<TrainGraph>, PathEdge>();
    return new Map((function* () {
      for (const we of walkPathEdges(edge)) {
        const src = graph.graph!.getVertex(we.source.id)!;
        const dst = graph.graph!.getVertex(we.target.id)!;
        const edge = graph.graph!.getEdge(src, dst)!;
        yield [edge, we];
      }
    })());
  });
  return { path, pathEdges };
});
