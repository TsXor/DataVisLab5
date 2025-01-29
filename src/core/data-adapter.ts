import d3 from "d3";
import type { data, render } from "./dtypes";
import { Graph } from "./graph/graph";

import urlData from '@/data?url'

type Result<Success, Failure> = {
  success: true;
  data: Success;
} | {
  success: false;
  failure: Failure;
};

type MapDataFailure = {
  provinces: boolean;
  countieIds: boolean;
  counties?: number[];
};

export async function collectMapData(): Promise<Result<render.MapData, MapDataFailure>> {
  let success = true;
  const failure: MapDataFailure = { provinces: false, countieIds: false };
  const [ provinces, countieIds ] = await Promise.all([
    d3.json<data.RegionCollection>(`${urlData}/map/provinces.json`),
    d3.json<number[]>(`${urlData}/map/countie-ids.json`),
  ]);
  if (!provinces) { success = false; failure.provinces = true; }
  if (!countieIds) { success = false; failure.countieIds = true; }
  if (!success) return { success, failure };
  failure.counties = [];
  let fetchId = (id: number) => d3.json<data.RegionCollection>(`${urlData}/map/counties/${id}.json`);
  const features = (await Promise.all(countieIds!.map(fetchId))).flatMap((countie, i) => {
    if (countie) { return countie.features; }
    else { failure.counties!.push(countieIds![i]); return []; }
  });
  if (failure.counties.length !== 0) { success = false; }
  if (!success) return { success, failure };
  return { success, data: { provinces: provinces!, counties: { type: "FeatureCollection", features } } };
}

type TrainGraph = Graph<data.Station, data.Route>;

type TrainGraphFailure = {
  stations: boolean;
  routes: boolean;
};

export async function collectTrainGraph(): Promise<Result<TrainGraph, TrainGraphFailure>> {
  let success = true;
  const failure: TrainGraphFailure = { stations: false, routes: false };
  const [ stations, routes ] = await Promise.all([
    d3.json<data.StationData>(`${urlData}/graph/stations.json`),
    d3.json<data.RouteData>(`${urlData}/graph/routes.json`),
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
