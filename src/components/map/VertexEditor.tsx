import { useCallback, useEffect, useRef, useMemo } from "react";
import { Source, Layer, useMap } from "@vis.gl/react-maplibre";
import type { MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import { useGeomStore } from "@/stores/geom-store";
import { extractAllVertices, updateVertexInCollection } from "@/utils/geo-utils";
import type { FeatureCollection, Point } from "geojson";

const VERTEX_LAYER_ID = "vertex-points";

export function VertexEditor() {
  const { current: map } = useMap();
  const geojson = useGeomStore((s) => s.geojson);
  const updateGeometry = useGeomStore((s) => s.updateGeometry);

  const draggingRef = useRef<{
    path: number[];
    active: boolean;
  } | null>(null);

  const vertexData = useMemo<FeatureCollection<Point>>(() => {
    if (!geojson) return { type: "FeatureCollection", features: [] };

    const vertices = extractAllVertices(geojson);
    return {
      type: "FeatureCollection",
      features: vertices.map((v, i) => ({
        type: "Feature" as const,
        id: i,
        properties: {
          path: JSON.stringify(v.path),
          index: i,
        },
        geometry: {
          type: "Point" as const,
          coordinates: v.position,
        },
      })),
    };
  }, [geojson]);

  const handleMouseEnter = useCallback(() => {
    if (!map) return;
    map.getCanvas().style.cursor = "grab";
  }, [map]);

  const handleMouseLeave = useCallback(() => {
    if (!map || draggingRef.current?.active) return;
    map.getCanvas().style.cursor = "";
  }, [map]);

  const handleMouseDown = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!map || !e.features?.[0]) return;
      e.preventDefault();

      const feature = e.features[0];
      const path = JSON.parse(feature.properties?.path ?? "[]") as number[];

      draggingRef.current = { path, active: true };
      map.getCanvas().style.cursor = "grabbing";
      map.dragPan.disable();
    },
    [map],
  );

  const handleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!draggingRef.current?.active || !geojson) return;

      const newPos = [e.lngLat.lng, e.lngLat.lat];
      const updated = updateVertexInCollection(
        geojson,
        draggingRef.current.path,
        newPos,
      );
      updateGeometry(updated);
    },
    [geojson, updateGeometry],
  );

  const handleMouseUp = useCallback(() => {
    if (!map || !draggingRef.current?.active) return;

    draggingRef.current = null;
    map.getCanvas().style.cursor = "";
    map.dragPan.enable();
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap();

    mapInstance.on("mouseenter", VERTEX_LAYER_ID, handleMouseEnter);
    mapInstance.on("mouseleave", VERTEX_LAYER_ID, handleMouseLeave);
    mapInstance.on("mousedown", VERTEX_LAYER_ID, handleMouseDown as unknown as (e: maplibregl.MapLayerMouseEvent) => void);
    mapInstance.on("mousemove", handleMouseMove as unknown as (e: maplibregl.MapMouseEvent) => void);
    mapInstance.on("mouseup", handleMouseUp);

    return () => {
      mapInstance.off("mouseenter", VERTEX_LAYER_ID, handleMouseEnter);
      mapInstance.off("mouseleave", VERTEX_LAYER_ID, handleMouseLeave);
      mapInstance.off("mousedown", VERTEX_LAYER_ID, handleMouseDown as unknown as (e: maplibregl.MapLayerMouseEvent) => void);
      mapInstance.off("mousemove", handleMouseMove as unknown as (e: maplibregl.MapMouseEvent) => void);
      mapInstance.off("mouseup", handleMouseUp);
    };
  }, [map, handleMouseEnter, handleMouseLeave, handleMouseDown, handleMouseMove, handleMouseUp]);

  if (!geojson || vertexData.features.length === 0) return null;

  return (
    <Source id="vertex-data" type="geojson" data={vertexData}>
      <Layer
        id={VERTEX_LAYER_ID}
        type="circle"
        paint={{
          "circle-radius": 5,
          "circle-color": "#ffffff",
          "circle-stroke-color": "#bd93f9",
          "circle-stroke-width": 2,
        }}
      />
    </Source>
  );
}
