import proj4 from "proj4";
import type { Feature, Geometry, Position } from "geojson";

// proj4 includes EPSG:4326 and EPSG:3857 by default.
// Register a few common UTM zones.
const COMMON_PROJECTIONS: Record<number, { name: string; def?: string }> = {
  4326: { name: "WGS 84" },
  3857: { name: "Web Mercator" },
  32632: {
    name: "WGS 84 / UTM zone 32N",
    def: "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs",
  },
  32633: {
    name: "WGS 84 / UTM zone 33N",
    def: "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs",
  },
  32617: {
    name: "WGS 84 / UTM zone 17N",
    def: "+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs",
  },
  32618: {
    name: "WGS 84 / UTM zone 18N",
    def: "+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs",
  },
  2154: {
    name: "RGF93 / Lambert-93",
    def: "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  },
};

// Register common projections at import time
for (const [code, info] of Object.entries(COMMON_PROJECTIONS)) {
  if (info.def) {
    proj4.defs(`EPSG:${code}`, info.def);
  }
}

export function getProjectionName(epsg: number): string {
  return COMMON_PROJECTIONS[epsg]?.name ?? `EPSG:${epsg}`;
}

export function isProjectionKnown(epsg: number): boolean {
  try {
    proj4.defs(`EPSG:${epsg}`);
    return proj4.defs(`EPSG:${epsg}`) !== undefined;
  } catch {
    return false;
  }
}

export async function fetchAndRegisterEpsg(epsg: number): Promise<boolean> {
  if (isProjectionKnown(epsg)) return true;
  try {
    const response = await fetch(`https://epsg.io/${epsg}.proj4`);
    if (!response.ok) return false;
    const def = await response.text();
    if (!def.trim().startsWith("+")) return false;
    proj4.defs(`EPSG:${epsg}`, def.trim());
    return true;
  } catch {
    return false;
  }
}

function transformPosition(
  pos: Position,
  fromEpsg: number,
  toEpsg: number,
): Position {
  const [x, y] = proj4(`EPSG:${fromEpsg}`, `EPSG:${toEpsg}`, [pos[0], pos[1]]);
  return pos.length > 2 ? [x, y, pos[2]] : [x, y];
}

function transformCoords(
  coords: unknown,
  fromEpsg: number,
  toEpsg: number,
): unknown {
  if (!Array.isArray(coords)) return coords;
  if (typeof coords[0] === "number") {
    return transformPosition(coords as Position, fromEpsg, toEpsg);
  }
  return coords.map((c) => transformCoords(c, fromEpsg, toEpsg));
}

export function transformGeometry(
  geometry: Geometry,
  fromEpsg: number,
  toEpsg: number,
): Geometry {
  if (fromEpsg === toEpsg) return geometry;

  if (geometry.type === "GeometryCollection") {
    return {
      ...geometry,
      geometries: geometry.geometries.map((g) =>
        transformGeometry(g, fromEpsg, toEpsg),
      ),
    };
  }

  return {
    ...geometry,
    coordinates: transformCoords(
      (geometry as { coordinates: unknown }).coordinates,
      fromEpsg,
      toEpsg,
    ),
  } as Geometry;
}

export function transformFeature(
  feature: Feature,
  fromEpsg: number,
  toEpsg: number,
): Feature {
  return {
    ...feature,
    geometry: transformGeometry(feature.geometry, fromEpsg, toEpsg),
  };
}

export const PRESET_PROJECTIONS = [
  { epsg: 4326, name: "WGS 84" },
  { epsg: 3857, name: "Web Mercator" },
  { epsg: 32632, name: "UTM 32N" },
  { epsg: 32617, name: "UTM 17N" },
];
