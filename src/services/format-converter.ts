import type { Feature, Geometry } from "geojson";
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

export function toGeoJSON(text: string, format: InputFormat): Feature {
  const trimmed = text.trim();

  switch (format) {
    case "wkt": {
      const geometry = wktToGeoJSON(trimmed);
      return normalizeToFeature(geometry);
    }

    case "wkb": {
      const geometry = wkbHexToGeoJSON(trimmed);
      return normalizeToFeature(geometry);
    }

    case "geojson": {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === "FeatureCollection") {
        // Take the first feature
        if (parsed.features?.length > 0) {
          return parsed.features[0] as Feature;
        }
        throw new Error("Empty FeatureCollection");
      }
      return normalizeToFeature(parsed);
    }

    case "esrijson": {
      const parsed = JSON.parse(trimmed);
      const converted = arcgisToGeoJSON(parsed);
      return normalizeToFeature(converted as Geometry | Feature);
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

export function fromGeoJSON(feature: Feature): ConvertedFormats {
  const geometry = feature.geometry;
  const result: ConvertedFormats = {
    wkt: null,
    wkb: null,
    geojsonText: null,
    esriJson: null,
  };

  // GeoJSON text (always works)
  result.geojsonText = JSON.stringify(geometry, null, 2);

  // WKT
  try {
    result.wkt = geojsonToWkt(geometry);
  } catch (err) {
    console.warn("WKT conversion failed:", err);
  }

  // WKB hex
  try {
    result.wkb = geojsonToWkbHex(geometry);
  } catch (err) {
    console.warn("WKB conversion failed:", err);
  }

  // EsriJSON
  try {
    const esri = geojsonToArcGIS(geometry);
    result.esriJson = JSON.stringify(esri, null, 2);
  } catch (err) {
    console.warn("EsriJSON conversion failed:", err);
  }

  return result;
}
