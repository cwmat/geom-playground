import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { InputFormat } from "@/types/geometry";
import { arcgisToGeoJSON, geojsonToArcGIS } from "@terraformer/arcgis";
import {
  wktToGeoJSON,
  wkbHexToGeoJSON,
  geojsonToWkt,
  geojsonToWkbHex,
} from "./geos-service";

function normalizeToFeature(input: Geometry | Feature): Feature {
  if (input.type === "Feature") {
    return input as Feature;
  }
  return {
    type: "Feature",
    properties: {},
    geometry: input as Geometry,
  };
}

function wrapAsCollection(features: Feature[]): FeatureCollection {
  return { type: "FeatureCollection", features };
}

/**
 * Merge all geometries from a FeatureCollection into a single GeometryCollection.
 * If there's only one feature, returns its geometry directly.
 */
export function mergeGeometries(fc: FeatureCollection): Geometry {
  const geometries = fc.features.map((f) => f.geometry);
  if (geometries.length === 1) return geometries[0];
  return { type: "GeometryCollection", geometries };
}

export function toGeoJSON(text: string, format: InputFormat): FeatureCollection {
  const trimmed = text.trim();

  switch (format) {
    case "wkt": {
      const geometry = wktToGeoJSON(trimmed);
      return wrapAsCollection([normalizeToFeature(geometry)]);
    }

    case "wkb": {
      const geometry = wkbHexToGeoJSON(trimmed);
      return wrapAsCollection([normalizeToFeature(geometry)]);
    }

    case "geojson": {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === "FeatureCollection") {
        if (!parsed.features?.length) {
          throw new Error("Empty FeatureCollection");
        }
        return parsed as FeatureCollection;
      }
      return wrapAsCollection([normalizeToFeature(parsed)]);
    }

    case "esrijson": {
      const parsed = JSON.parse(trimmed);
      const converted = arcgisToGeoJSON(parsed);
      return wrapAsCollection([normalizeToFeature(converted as Geometry | Feature)]);
    }

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export interface ConvertedFormats {
  wkt: string | null;
  wkb: string | null;
  geojsonText: string | null;
  esriJson: string | null;
}

export function fromGeoJSON(fc: FeatureCollection): ConvertedFormats {
  const result: ConvertedFormats = {
    wkt: null,
    wkb: null,
    geojsonText: null,
    esriJson: null,
  };

  // GeoJSON text — output the full FeatureCollection
  result.geojsonText = JSON.stringify(fc, null, 2);

  // For WKT/WKB, merge into a single geometry (GeometryCollection if multiple)
  const merged = mergeGeometries(fc);

  // WKT
  try {
    result.wkt = geojsonToWkt(merged);
  } catch (err) {
    console.warn("WKT conversion failed:", err);
  }

  // WKB hex
  try {
    result.wkb = geojsonToWkbHex(merged);
  } catch (err) {
    console.warn("WKB conversion failed:", err);
  }

  // EsriJSON — convert each feature's geometry separately, output as array if multiple
  try {
    if (fc.features.length === 1) {
      const esri = geojsonToArcGIS(fc.features[0].geometry);
      result.esriJson = JSON.stringify(esri, null, 2);
    } else {
      const esriArray = fc.features.map((f) => geojsonToArcGIS(f.geometry));
      result.esriJson = JSON.stringify(esriArray, null, 2);
    }
  } catch (err) {
    console.warn("EsriJSON conversion failed:", err);
  }

  return result;
}
