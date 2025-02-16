import { isDefined } from '@vueuse/core';
import * as d3 from 'd3';
import type { TrainGraph } from "./data-adapter";
import type { EdgeOf, VertexOf } from "./graph/graph";

export function stationDegree(station: VertexOf<TrainGraph>) {
  return station.in.size + station.out.size;
}
export function routeDegree(route: EdgeOf<TrainGraph>) {
  return (stationDegree(route.source) + stationDegree(route.target)) / 2;
}
export function routeShiftApprox(route: EdgeOf<TrainGraph>) {
  // 哦天哪我也不知道这是啥。
  const whatIsThis = d3.min([route.data.shifts, 5])! + 1;
  const whatIsThat = d3.min([(route.source.data.access + route.target.data.access) / 2, 31921.15])!;
  return whatIsThis * whatIsThat;
}

export function routeDuration(route: EdgeOf<TrainGraph>) { return route.data.params[0]; }
export function routeDistance(route: EdgeOf<TrainGraph>) { return route.data.params[1]; }

export type DataExtents = {
  stationDegree: [number, number];
  stationAccess: [number, number];
  routeDegree: [number, number];
  routeShift: [number, number];
};

export function graphExtents(graph: TrainGraph) {
  return {
    stationDegree: d3.extent(graph.vertices.values(), stationDegree),
    stationAccess: d3.extent(graph.vertices.values(), v => v.data.access),
    routeDegree: d3.extent(graph.outOrderEdges(), routeDegree),
    routeShift: d3.extent(graph.outOrderEdges(), routeShiftApprox),
  } as DataExtents;
}

export type ScaleRanges = {
  nodeRadius: [number, number],
  nodeColor: [string, string],
  lineWidth: [number, number],
  lineColor: [string, string],
};

export type Scalers = {
  nodeRadius: d3.ScaleLinear<number, number>;
  nodeColor: d3.ScaleLinear<string, string>;
  lineWidth: d3.ScaleLinear<number, number>;
  lineColor: d3.ScaleLinear<string, string>;
};

export function graphScalers(extents: DataExtents, ranges: ScaleRanges) {
  return {
    nodeRadius: d3.scaleLinear<number>(extents.stationDegree, ranges.nodeRadius),
    nodeColor: d3.scaleLinear<string>(extents.stationAccess, ranges.nodeColor),
    lineWidth: d3.scaleLinear<number>(extents.routeDegree, ranges.lineWidth),
    lineColor: d3.scaleLinear<string>(extents.routeShift, ranges.lineColor),
  }
}

/**
 * 给定端点经纬度，计算两点间球面距离。
 * @param src 起点的经度和纬度
 * @param dst 终点的经度和纬度
 * @returns 距离，单位为千米
 */
export function globalDistance(src: [number, number], dst: [number, number]): number {
  const [srcLng, srcLat] = src;
  const [dstLng, dstLat] = dst;
  const R = 6371; // 地球半径，单位为千米
  const φ1 = (srcLat * Math.PI) / 180;
  const φ2 = (dstLat * Math.PI) / 180;
  const Δφ = ((dstLat - srcLat) * Math.PI) / 180;
  const Δλ = ((dstLng - srcLng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type RangeFilter = {
  min?: number;
  max?: number;
};

export function filterRange(value: number, range?: RangeFilter) {
  if (!range) return true;
  const { min, max } = range;
  if (isDefined(min) && value < min) return false;
  if (isDefined(max) && value > max) return false;
  return true;
}

export type StationFilter = {
  stationDegree: RangeFilter;
  stationAccess: RangeFilter;
};

export type RouteFilter = {
  routeDegree: RangeFilter;
  routeShift: RangeFilter;
};

export function filterStation(station: VertexOf<TrainGraph>, filter: Partial<StationFilter>) {
  if (!filterRange(stationDegree(station), filter.stationDegree)) return false;
  if (!filterRange(station.data.access, filter.stationAccess)) return false;
  return true;
}

export function filterRoute(route: EdgeOf<TrainGraph>, filter: Partial<RouteFilter>) {
  if (!filterRange(routeDegree(route), filter.routeDegree)) return false;
  if (!filterRange(routeShiftApprox(route), filter.routeShift)) return false;
  return true;
}
