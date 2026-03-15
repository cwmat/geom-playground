import { create } from "zustand";
import type { Feature } from "geojson";
import type {
  GeosStatus,
  ParseStatus,
  InputFormat,
  GeometryProperties,
} from "@/types/geometry";
import { initGeos as initGeosService } from "@/services/geos-service";
import {
  computeArea,
  computeLength,
  computeCentroid,
  computeBbox,
  countVertices,
  getGeometryType,
} from "@/services/geos-service";
import { detectFormat } from "@/services/format-detector";
import { toGeoJSON, fromGeoJSON } from "@/services/format-converter";
import type { ConvertedFormats } from "@/services/format-converter";
import {
  transformFeature,
  fetchAndRegisterEpsg,
  isProjectionKnown,
} from "@/services/projection-service";

interface GeomStore {
  // GEOS lifecycle
  geosStatus: GeosStatus;
  geosError: string | null;
  initGeos: () => Promise<void>;

  // Input
  inputText: string;
  detectedFormat: InputFormat;
  parseStatus: ParseStatus;
  parseError: string | null;

  // Parsed geometry
  geojson: Feature | null;

  // Converted representations
  wkt: string | null;
  wkb: string | null;
  geojsonText: string | null;
  esriJson: string | null;

  // Computed properties
  properties: GeometryProperties | null;

  // Projection
  currentEpsg: number;

  // Actions
  parseInput: (text: string) => void;
  updateGeometry: (feature: Feature) => void;
  setProjection: (epsg: number) => Promise<void>;
  clear: () => void;
}

function computeProperties(feature: Feature): GeometryProperties {
  const geometry = feature.geometry;
  return {
    geometryType: getGeometryType(geometry),
    vertexCount: countVertices(geometry),
    area: computeArea(geometry),
    length: computeLength(geometry),
    centroid: computeCentroid(geometry),
    bbox: computeBbox(geometry),
  };
}

function computeConversions(feature: Feature): ConvertedFormats {
  return fromGeoJSON(feature);
}

export const useGeomStore = create<GeomStore>()((set, get) => ({
  geosStatus: "idle",
  geosError: null,

  inputText: "",
  detectedFormat: "unknown",
  parseStatus: "idle",
  parseError: null,

  geojson: null,
  wkt: null,
  wkb: null,
  geojsonText: null,
  esriJson: null,

  properties: null,
  currentEpsg: 4326,

  initGeos: async () => {
    set({ geosStatus: "loading", geosError: null });
    try {
      await initGeosService();
      set({ geosStatus: "ready" });
    } catch (err) {
      set({
        geosStatus: "error",
        geosError: err instanceof Error ? err.message : "GEOS init failed",
      });
    }
  },

  parseInput: (text: string) => {
    set({ inputText: text });

    if (!text.trim()) {
      set({
        detectedFormat: "unknown",
        parseStatus: "idle",
        parseError: null,
        geojson: null,
        wkt: null,
        wkb: null,
        geojsonText: null,
        esriJson: null,
        properties: null,
      });
      return;
    }

    const format = detectFormat(text);
    set({ detectedFormat: format, parseStatus: "parsing", parseError: null });

    if (format === "unknown") {
      set({
        parseStatus: "error",
        parseError: "Could not detect geometry format. Supported: WKT, WKB (hex), GeoJSON, EsriJSON.",
      });
      return;
    }

    try {
      const feature = toGeoJSON(text, format);
      const conversions = computeConversions(feature);
      const properties = computeProperties(feature);

      set({
        parseStatus: "ready",
        parseError: null,
        geojson: feature,
        ...conversions,
        properties,
      });
    } catch (err) {
      set({
        parseStatus: "error",
        parseError: err instanceof Error ? err.message : "Failed to parse geometry",
        geojson: null,
        wkt: null,
        wkb: null,
        geojsonText: null,
        esriJson: null,
        properties: null,
      });
    }
  },

  updateGeometry: (feature: Feature) => {
    try {
      const conversions = computeConversions(feature);
      const properties = computeProperties(feature);

      set({
        geojson: feature,
        ...conversions,
        properties,
        parseStatus: "ready",
        parseError: null,
      });
    } catch (err) {
      console.warn("Failed to update geometry:", err);
    }
  },

  setProjection: async (epsg: number) => {
    const { geojson, currentEpsg } = get();
    if (!geojson || epsg === currentEpsg) {
      set({ currentEpsg: epsg });
      return;
    }

    // Ensure the target projection is registered
    if (!isProjectionKnown(epsg)) {
      const success = await fetchAndRegisterEpsg(epsg);
      if (!success) {
        set({ parseError: `Unknown EPSG code: ${epsg}` });
        return;
      }
    }

    try {
      const transformed = transformFeature(geojson, currentEpsg, epsg);
      const conversions = computeConversions(transformed);
      const properties = computeProperties(transformed);

      set({
        currentEpsg: epsg,
        geojson: transformed,
        ...conversions,
        properties,
        parseError: null,
      });
    } catch (err) {
      set({
        parseError: err instanceof Error ? err.message : "Projection failed",
      });
    }
  },

  clear: () => {
    set({
      inputText: "",
      detectedFormat: "unknown",
      parseStatus: "idle",
      parseError: null,
      geojson: null,
      wkt: null,
      wkb: null,
      geojsonText: null,
      esriJson: null,
      properties: null,
      currentEpsg: 4326,
    });
  },
}));
