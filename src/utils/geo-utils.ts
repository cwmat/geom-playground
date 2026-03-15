import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { LngLatBoundsLike } from "maplibre-gl";

export function bboxToLngLatBounds(
  bbox: [number, number, number, number],
): LngLatBoundsLike {
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
}

export interface VertexInfo {
  /** Path to this vertex: [featureIndex, ...geometryPath] */
  path: number[];
  position: Position;
}

function extractFromCoords(
  coords: Position,
  path: number[],
  result: VertexInfo[],
): void {
  result.push({ path: [...path], position: coords });
}

function extractFromRing(
  ring: Position[],
  basePath: number[],
  result: VertexInfo[],
): void {
  for (let i = 0; i < ring.length; i++) {
    extractFromCoords(ring[i], [...basePath, i], result);
  }
}

function extractVerticesFromGeometry(
  geometry: Geometry,
  basePath: number[],
  result: VertexInfo[],
): void {
  switch (geometry.type) {
    case "Point":
      extractFromCoords(geometry.coordinates, [...basePath, 0], result);
      break;
    case "MultiPoint":
    case "LineString":
      for (let i = 0; i < geometry.coordinates.length; i++) {
        extractFromCoords(geometry.coordinates[i], [...basePath, i], result);
      }
      break;
    case "MultiLineString":
    case "Polygon":
      for (let i = 0; i < geometry.coordinates.length; i++) {
        extractFromRing(geometry.coordinates[i], [...basePath, i], result);
      }
      break;
    case "MultiPolygon":
      for (let i = 0; i < geometry.coordinates.length; i++) {
        for (let j = 0; j < geometry.coordinates[i].length; j++) {
          extractFromRing(geometry.coordinates[i][j], [...basePath, i, j], result);
        }
      }
      break;
    case "GeometryCollection":
      break;
  }
}

/** Extract vertices from all features. Path format: [featureIndex, ...geometryPath] */
export function extractAllVertices(fc: FeatureCollection): VertexInfo[] {
  const result: VertexInfo[] = [];
  for (let fi = 0; fi < fc.features.length; fi++) {
    extractVerticesFromGeometry(fc.features[fi].geometry, [fi], result);
  }
  return result;
}

/** Legacy single-geometry extraction (kept for compatibility) */
export function extractVertices(geometry: Geometry): VertexInfo[] {
  const result: VertexInfo[] = [];
  extractVerticesFromGeometry(geometry, [], result);
  return result;
}

function updateVertexInSingleGeometry(
  geometry: Geometry,
  path: number[],
  newPosition: Position,
): Geometry {
  const geom = JSON.parse(JSON.stringify(geometry)) as Geometry;

  switch (geom.type) {
    case "Point":
      geom.coordinates = newPosition;
      break;
    case "MultiPoint":
    case "LineString":
      geom.coordinates[path[0]] = newPosition;
      break;
    case "MultiLineString":
    case "Polygon":
      geom.coordinates[path[0]][path[1]] = newPosition;
      if (geom.type === "Polygon") {
        const ring = geom.coordinates[path[0]];
        if (path[1] === 0) {
          ring[ring.length - 1] = newPosition;
        } else if (path[1] === ring.length - 1) {
          ring[0] = newPosition;
        }
      }
      break;
    case "MultiPolygon":
      geom.coordinates[path[0]][path[1]][path[2]] = newPosition;
      {
        const ring = geom.coordinates[path[0]][path[1]];
        if (path[2] === 0) {
          ring[ring.length - 1] = newPosition;
        } else if (path[2] === ring.length - 1) {
          ring[0] = newPosition;
        }
      }
      break;
  }

  return geom;
}

/** Update a vertex in a FeatureCollection. Path: [featureIndex, ...geometryPath] */
export function updateVertexInCollection(
  fc: FeatureCollection,
  path: number[],
  newPosition: Position,
): FeatureCollection {
  const [featureIndex, ...geomPath] = path;
  const features = fc.features.map((f, i) => {
    if (i !== featureIndex) return f;
    return {
      ...f,
      geometry: updateVertexInSingleGeometry(f.geometry, geomPath, newPosition),
    };
  });
  return { ...fc, features };
}

/** Legacy single-feature update */
export function updateVertexInGeometry(
  feature: Feature,
  path: number[],
  newPosition: Position,
): Feature {
  return {
    ...feature,
    geometry: updateVertexInSingleGeometry(feature.geometry, path, newPosition),
  };
}
