import type { Feature, FeatureCollection, Geometry } from "geojson";

export type InputFormat = "wkt" | "wkb" | "geojson" | "esrijson" | "unknown";

export type GeosStatus = "idle" | "loading" | "ready" | "error";

export type ParseStatus = "idle" | "parsing" | "ready" | "error";

export type SidePanel = "input" | "convert" | "properties" | "projection";

export interface GeometryProperties {
  geometryType: string;
  vertexCount: number;
  area: number | null;
  length: number | null;
  centroid: [number, number] | null;
  bbox: [number, number, number, number] | null;
}

export type GeomFeature = Feature<Geometry>;
export type GeomFeatureCollection = FeatureCollection<Geometry>;
