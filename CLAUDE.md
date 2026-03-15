# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # tsc -b && vite build (TypeScript checked before bundling)
npm run lint         # ESLint (flat config v9)
npm run format       # Prettier (100 char width, tailwind plugin)
```

No test framework is configured yet.

## Architecture

Client-side geometry playground: paste WKT/WKB/GeoJSON/EsriJSON, visualize on a map, convert between formats, compute properties, edit vertices, reproject.

### Three-layer abstraction

1. **GEOS WASM layer** (`src/services/geos-service.ts`) — Low-level Emscripten wrappers around the GEOS C API. Requires manual memory management: allocate strings on heap with `_malloc`/`stringToUTF8`, free with `_free`/`GEOSFree`. Every pointer must be freed in a `finally` block. Output parameters (area, length, bbox) use allocated `double*` pointers read with `getValue(ptr, "double")`.

2. **Format layer** (`src/services/`) — Format detection via regex/JSON heuristics (`format-detector.ts`), bidirectional conversion between all 4 formats (`format-converter.ts`), and proj4 coordinate transforms with on-demand EPSG fetching from epsg.io (`projection-service.ts`).

3. **UI layer** (components + Zustand stores) — `geom-store.ts` is the central store: GEOS lifecycle, parsed geometry, eagerly-computed conversions for all 4 formats, and geometry properties. `ui-store.ts` tracks sidebar/panel state only.

### Data flow

```
Text input → detectFormat() → toGeoJSON() → Feature stored in geom-store
  ├─ fromGeoJSON() → wkt, wkb, geojsonText, esriJson (all computed eagerly)
  ├─ computeProperties() → area, length, centroid, bbox, vertexCount
  └─ Components subscribe via Zustand selectors and re-render
```

Vertex editing calls `updateGeometry(feature)` which reruns the same conversion pipeline.

### Key patterns

- **GEOS runs on main thread** — single-geometry ops are sub-millisecond; no worker needed.
- **Format conversions are independent** — each wrapped in its own try-catch; one failure doesn't block others.
- **Projection transforms modify the geometry itself**, not just metadata. The `currentEpsg` tracks what CRS the coordinates are in.
- **Polygon ring closure** — `updateVertexInGeometry()` automatically syncs first/last vertex when either is moved.
- **FeatureCollections** — only the first feature is extracted; rest are silently dropped.
- **Debounced parsing** — `GeometryInput` updates `inputText` immediately but defers `parseInput()` by 300ms.

### Theme

Void Violet (#02): gradient `#0d0d0d → #1a1033 → #2d1b69`, accent `#bd93f9`. Map layers use `#bd93f9` (polygons/points) and `#8be9fd` (lines). Hardcoded in `GeometryRenderer.tsx` and `VertexEditor.tsx`.

### Path alias

`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Type declarations

`@terraformer/arcgis` has no bundled types — a manual `.d.ts` exists at `src/types/terraformer.d.ts`.
