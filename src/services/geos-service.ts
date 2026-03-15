import initGeosJs from "geos-wasm";

type GeosInstance = Awaited<ReturnType<typeof initGeosJs>>;

let geos: GeosInstance | null = null;

export async function initGeos(): Promise<void> {
  if (geos) return;
  geos = await initGeosJs();
}

export function getGeos(): GeosInstance {
  if (!geos) throw new Error("GEOS not initialized");
  return geos;
}

export function isGeosReady(): boolean {
  return geos !== null;
}

// Helper: allocate a string on the Emscripten heap, run fn, then free it
function withAllocatedString<T>(str: string, fn: (ptr: number) => T): T {
  const g = getGeos();
  const mod = g.Module;
  // Worst case: each JS char = 4 UTF-8 bytes, plus null terminator
  const maxLen = str.length * 4 + 1;
  const ptr = mod._malloc(maxLen);
  try {
    mod.stringToUTF8(str, ptr, maxLen);
    return fn(ptr);
  } finally {
    mod._free(ptr);
  }
}

// Helper: read a string from a pointer returned by GEOS, then free it
function readAndFreeString(ptr: number): string {
  const g = getGeos();
  const mod = g.Module;
  const result = mod.UTF8ToString(ptr);
  g.GEOSFree(ptr);
  return result;
}

// Helper: allocate a double pointer, run fn, read the value, free it
function withDoublePtr<T>(fn: (ptr: number) => T): { retval: T; value: number } {
  const g = getGeos();
  const mod = g.Module;
  const ptr = mod._malloc(8); // sizeof(double) = 8
  try {
    const retval = fn(ptr);
    const value = mod.getValue(ptr, "double");
    return { retval, value };
  } finally {
    mod._free(ptr);
  }
}

// Read GeoJSON string into GEOS geometry pointer
function readGeoJSON(geojsonStr: string): number {
  const g = getGeos();
  const reader = g.GEOSGeoJSONReader_create();
  try {
    return withAllocatedString(geojsonStr, (strPtr) => {
      const geomPtr = g.GEOSGeoJSONReader_readGeometry(reader, strPtr);
      if (!geomPtr) throw new Error("Failed to read GeoJSON geometry");
      return geomPtr;
    });
  } finally {
    g.GEOSGeoJSONReader_destroy(reader);
  }
}

// Write GEOS geometry to GeoJSON string
function writeGeoJSON(geomPtr: number): string {
  const g = getGeos();
  const writer = g.GEOSGeoJSONWriter_create();
  try {
    const strPtr = g.GEOSGeoJSONWriter_writeGeometry(writer, geomPtr, 0);
    if (!strPtr) throw new Error("Failed to write GeoJSON");
    return readAndFreeString(strPtr);
  } finally {
    g.GEOSGeoJSONWriter_destroy(writer);
  }
}

// Run a function with a GEOS geometry created from GeoJSON, clean up afterwards
function withGeomFromGeoJSON<T>(
  geometry: GeoJSON.Geometry,
  fn: (geomPtr: number) => T,
): T {
  const g = getGeos();
  const geomPtr = readGeoJSON(JSON.stringify(geometry));
  try {
    return fn(geomPtr);
  } finally {
    g.GEOSGeom_destroy(geomPtr);
  }
}

export function wktToGeoJSON(wkt: string): GeoJSON.Geometry {
  const g = getGeos();
  const reader = g.GEOSWKTReader_create();
  try {
    const geomPtr = withAllocatedString(wkt, (strPtr) => {
      const ptr = g.GEOSWKTReader_read(reader, strPtr);
      if (!ptr) throw new Error("Failed to parse WKT");
      return ptr;
    });
    try {
      const json = writeGeoJSON(geomPtr);
      return JSON.parse(json);
    } finally {
      g.GEOSGeom_destroy(geomPtr);
    }
  } finally {
    g.GEOSWKTReader_destroy(reader);
  }
}

export function geojsonToWkt(geometry: GeoJSON.Geometry): string {
  const g = getGeos();
  return withGeomFromGeoJSON(geometry, (geomPtr) => {
    const writer = g.GEOSWKTWriter_create();
    try {
      g.GEOSWKTWriter_setRoundingPrecision(writer, 8);
      const strPtr = g.GEOSWKTWriter_write(writer, geomPtr);
      if (!strPtr) throw new Error("Failed to write WKT");
      return readAndFreeString(strPtr);
    } finally {
      g.GEOSWKTWriter_destroy(writer);
    }
  });
}

export function wkbHexToGeoJSON(hex: string): GeoJSON.Geometry {
  const g = getGeos();
  const mod = g.Module;
  const reader = g.GEOSWKBReader_create();
  try {
    // Allocate hex string on heap
    const hexLen = hex.length;
    const hexPtr = mod._malloc(hexLen + 1);
    try {
      mod.stringToUTF8(hex, hexPtr, hexLen + 1);
      const geomPtr = g.GEOSWKBReader_readHEX(reader, hexPtr, hexLen);
      if (!geomPtr) throw new Error("Failed to parse WKB hex");
      try {
        const json = writeGeoJSON(geomPtr);
        return JSON.parse(json);
      } finally {
        g.GEOSGeom_destroy(geomPtr);
      }
    } finally {
      mod._free(hexPtr);
    }
  } finally {
    g.GEOSWKBReader_destroy(reader);
  }
}

export function geojsonToWkbHex(geometry: GeoJSON.Geometry): string {
  const g = getGeos();
  const mod = g.Module;
  return withGeomFromGeoJSON(geometry, (geomPtr) => {
    const writer = g.GEOSWKBWriter_create();
    try {
      const { value: size } = withDoublePtr((sizePtr) => {
        return g.GEOSWKBWriter_writeHEX(writer, geomPtr, sizePtr);
      });
      const hexPtr = withDoublePtr((sizePtr) => {
        return g.GEOSWKBWriter_writeHEX(writer, geomPtr, sizePtr);
      });
      if (!hexPtr.retval) throw new Error("Failed to write WKB hex");
      const hexStr = mod.UTF8ToString(hexPtr.retval as unknown as number);
      g.GEOSFree(hexPtr.retval as unknown as number);
      void size;
      return hexStr;
    } finally {
      g.GEOSWKBWriter_destroy(writer);
    }
  });
}

export function computeArea(geometry: GeoJSON.Geometry): number | null {
  const g = getGeos();
  return withGeomFromGeoJSON(geometry, (geomPtr) => {
    const { retval, value } = withDoublePtr((areaPtr) => {
      return g.GEOSArea(geomPtr, areaPtr);
    });
    if (retval === 0) return null;
    return value > 0 ? value : null;
  });
}

export function computeLength(geometry: GeoJSON.Geometry): number | null {
  const g = getGeos();
  return withGeomFromGeoJSON(geometry, (geomPtr) => {
    const { retval, value } = withDoublePtr((lengthPtr) => {
      return g.GEOSLength(geomPtr, lengthPtr);
    });
    if (retval === 0) return null;
    return value > 0 ? value : null;
  });
}

export function computeCentroid(
  geometry: GeoJSON.Geometry,
): [number, number] | null {
  const g = getGeos();
  return withGeomFromGeoJSON(geometry, (geomPtr) => {
    const centroidPtr = g.GEOSGetCentroid(geomPtr);
    if (!centroidPtr) return null;
    try {
      const xResult = withDoublePtr((xPtr) => g.GEOSGeomGetX(centroidPtr, xPtr));
      const yResult = withDoublePtr((yPtr) => g.GEOSGeomGetY(centroidPtr, yPtr));
      if (xResult.retval === -1 || yResult.retval === -1) return null;
      return [xResult.value, yResult.value];
    } finally {
      g.GEOSGeom_destroy(centroidPtr);
    }
  });
}

export function computeBbox(
  geometry: GeoJSON.Geometry,
): [number, number, number, number] | null {
  const g = getGeos();
  const mod = g.Module;
  return withGeomFromGeoJSON(geometry, (geomPtr) => {
    // Use GEOSGeom_getExtent which gets all 4 values at once
    const xminPtr = mod._malloc(8);
    const yminPtr = mod._malloc(8);
    const xmaxPtr = mod._malloc(8);
    const ymaxPtr = mod._malloc(8);
    try {
      const retval = g.GEOSGeom_getExtent(geomPtr, xminPtr, yminPtr, xmaxPtr, ymaxPtr);
      if (retval === 0) return null;
      const minX = mod.getValue(xminPtr, "double");
      const minY = mod.getValue(yminPtr, "double");
      const maxX = mod.getValue(xmaxPtr, "double");
      const maxY = mod.getValue(ymaxPtr, "double");
      return [minX, minY, maxX, maxY];
    } finally {
      mod._free(xminPtr);
      mod._free(yminPtr);
      mod._free(xmaxPtr);
      mod._free(ymaxPtr);
    }
  });
}

export function countVertices(geometry: GeoJSON.Geometry): number {
  return withGeomFromGeoJSON(geometry, (geomPtr) => {
    return getGeos().GEOSGetNumCoordinates(geomPtr);
  });
}

export function getGeometryType(geometry: GeoJSON.Geometry): string {
  return geometry.type;
}
