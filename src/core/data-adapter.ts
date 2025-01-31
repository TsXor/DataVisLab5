import * as d3 from 'd3';
import type { data, render } from "./dtypes";
import { Graph, type EdgeOf, type VertexOf } from "./graph/graph";
import type { Result } from "./utils";

function unwrapImport<T>(promise: Promise<any>): Promise<T> {
  return promise.then(o => o.default) as Promise<T>;
}

type MapDataFailure = {
  provinces: boolean;
  countieIds: boolean;
  counties?: number[];
};

export async function collectMapData(): Promise<Result<render.MapData, MapDataFailure>> {
  let success = true;
  const failure: MapDataFailure = { provinces: false, countieIds: false };
  const [ provinces, countieIds ] = await Promise.all([
    unwrapImport<data.RegionCollection>(import('@/data/map/provinces.json')),
    unwrapImport<number[]>(import('@/data/map/countie-ids.json')),
  ]);
  if (!provinces) { success = false; failure.provinces = true; }
  if (!countieIds) { success = false; failure.countieIds = true; }
  if (!success) return { success, failure };
  failure.counties = [];
  let fetchId = (id: number) => unwrapImport<data.RegionCollection>(import(`@/data/map/counties/${id}.json`));
  const features = (await Promise.all(countieIds!.map(fetchId))).flatMap((countie, i) => {
    if (countie) { return countie.features; }
    else { failure.counties!.push(countieIds![i]); return []; }
  });
  if (failure.counties.length !== 0) { success = false; }
  if (!success) return { success, failure };
  return { success, data: { provinces: provinces!, counties: { type: "FeatureCollection", features } } };
}

export type TrainGraph = Graph<data.Station, data.Route>;

type TrainGraphFailure = {
  stations: boolean;
  routes: boolean;
};

export async function collectTrainGraph(): Promise<Result<TrainGraph, TrainGraphFailure>> {
  let success = true;
  const failure: TrainGraphFailure = { stations: false, routes: false };
  const [ stations, routes ] = await Promise.all([
    unwrapImport<data.StationData>(import('@/data/graph/stations.json')),
    unwrapImport<data.RouteData>(import('@/data/graph/routes.json')),
  ]);
  if (!stations) { success = false; failure.stations = true; }
  if (!routes) { success = false; failure.routes = true; }
  if (!success) return { success, failure };
  const G = new Graph<data.Station, data.Route>(vertex => vertex.name);
  for (const station of stations!) { G.addVertex(station); }
  for (const { name: src, to } of routes!) {
    for (const { name: dst, data } of to) {
      G.addEdge(G.getVertex(src)!, G.getVertex(dst)!, data);
    }
  }
  return { success, data: G };
}

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
