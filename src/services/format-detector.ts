import type { InputFormat } from "@/types/geometry";

const GEOJSON_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
  "Feature",
  "FeatureCollection",
]);

const WKT_PATTERN =
  /^(POINT|MULTIPOINT|LINESTRING|MULTILINESTRING|POLYGON|MULTIPOLYGON|GEOMETRYCOLLECTION)\s*(Z|M|ZM)?\s*(\(|EMPTY)/i;

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

export function detectFormat(input: string): InputFormat {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";

  // JSON-based formats
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const obj = JSON.parse(trimmed);
      const target = Array.isArray(obj) ? obj[0] : obj;
      if (!target || typeof target !== "object") return "unknown";

      // GeoJSON
      if (target.type && GEOJSON_TYPES.has(target.type)) {
        return "geojson";
      }

      // EsriJSON: has geometry-specific keys
      if (
        target.rings ||
        target.paths ||
        target.points ||
        target.curvePaths ||
        target.curveRings ||
        (target.x !== undefined && target.y !== undefined)
      ) {
        return "esrijson";
      }

      // Could be a Feature with esri geometry
      if (target.geometry) {
        const geom = target.geometry;
        if (
          geom.rings ||
          geom.paths ||
          geom.points ||
          (geom.x !== undefined && geom.y !== undefined)
        ) {
          return "esrijson";
        }
      }
    } catch {
      // Not valid JSON
    }
    return "unknown";
  }

  // WKT
  if (WKT_PATTERN.test(trimmed)) {
    return "wkt";
  }

  // WKB hex
  if (HEX_PATTERN.test(trimmed) && trimmed.length % 2 === 0 && trimmed.length >= 10) {
    return "wkb";
  }

  return "unknown";
}
