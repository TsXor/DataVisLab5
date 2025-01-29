export as namespace dtypes;
import * as GeoJSON from "geojson";

namespace data {

type ObjectDict<V> = Record<string, V>;
type ObjectDoubleDict<V> = Record<string, Record<string, V>>;

type RegionProps = {
  id: number;
  name: string;
  cp: [number, number];
  childNum: number;
};

type Region = GeoJSON.Feature<GeoJSON.Geometry, RegionProps>;
type RegionCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProps>;

namespace legacy {

type AccessInfo = ObjectDict<number>;
type StationGeo = ObjectDict<[number, number]>;
type AdjacencyInfo = ObjectDoubleDict<[number, number, number]>;
type TrainInfo = ObjectDoubleDict<number>;

} // namespace legacy

type Station = {
  name: string;
  access: number;
  geo: [number, number]; // 经度，纬度 [longitude, latitude]
};
type Route = {
  shifts: number; // 车次数量
  params: [number, number, number]; // duration_minute, distance_km, _
};

type StationData = Station[];
type RouteData = {
  name: string;
  to: {
    name: string;
    data: Route;
  }[];
}[];

} // namespace data

namespace render {

interface MapData {
  provinces: data.RegionCollection;
  counties: data.RegionCollection;
}; 

} // namespace render
