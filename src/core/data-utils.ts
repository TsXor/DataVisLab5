import * as d3 from 'd3';
import type { EdgeOf, VertexOf } from "./graph/graph";
import type { TrainGraph } from "./data-adapter";

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

export function graphScalers(graph: TrainGraph) {
  // TODO: 根据数据范围动态决定下列比例尺。
  return {
    nodeRadius: d3.scaleLinear<number>().domain([0, 15]).range([5, 15]),
    nodeColor: d3.scaleLinear<string>().domain([10000, 25000]).range(["steelblue", "tomato"]),
    lineWidth: d3.scaleLinear<number>().domain([0, 30]).range([1.5, 10.5]),
    lineColor: d3.scaleLinear<string>().domain([10000, 160000]).range(["steelblue", "tomato"]),
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
