import type { Feature, Geometry, Position } from "geojson";
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

export function extractVertices(geometry: Geometry): VertexInfo[] {
  const result: VertexInfo[] = [];

  switch (geometry.type) {
    case "Point":
      extractFromCoords(geometry.coordinates, [0], result);
      break;
    case "MultiPoint":
    case "LineString":
      for (let i = 0; i < geometry.coordinates.length; i++) {
        extractFromCoords(geometry.coordinates[i], [i], result);
      }
      break;
    case "MultiLineString":
    case "Polygon":
      for (let i = 0; i < geometry.coordinates.length; i++) {
        extractFromRing(geometry.coordinates[i], [i], result);
      }
      break;
    case "MultiPolygon":
      for (let i = 0; i < geometry.coordinates.length; i++) {
        for (let j = 0; j < geometry.coordinates[i].length; j++) {
          extractFromRing(geometry.coordinates[i][j], [i, j], result);
        }
      }
      break;
    case "GeometryCollection":
      // Don't extract from geometry collections for vertex editing
      break;
  }

  return result;
}

export function updateVertexInGeometry(
  feature: Feature,
  path: number[],
  newPosition: Position,
): Feature {
  const geometry = JSON.parse(JSON.stringify(feature.geometry)) as Geometry;

  switch (geometry.type) {
    case "Point":
      geometry.coordinates = newPosition;
      break;
    case "MultiPoint":
    case "LineString":
      geometry.coordinates[path[0]] = newPosition;
      break;
    case "MultiLineString":
    case "Polygon":
      geometry.coordinates[path[0]][path[1]] = newPosition;
      // For polygons, close the ring if first/last vertex is edited
      if (geometry.type === "Polygon") {
        const ring = geometry.coordinates[path[0]];
        if (path[1] === 0) {
          ring[ring.length - 1] = newPosition;
        } else if (path[1] === ring.length - 1) {
          ring[0] = newPosition;
        }
      }
      break;
    case "MultiPolygon":
      geometry.coordinates[path[0]][path[1]][path[2]] = newPosition;
      // Close the ring if needed
      {
        const ring = geometry.coordinates[path[0]][path[1]];
        if (path[2] === 0) {
          ring[ring.length - 1] = newPosition;
        } else if (path[2] === ring.length - 1) {
          ring[0] = newPosition;
        }
      }
      break;
  }

  return { ...feature, geometry };
}
