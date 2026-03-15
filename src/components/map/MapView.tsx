import { useRef, useEffect, useCallback } from "react";
import { Map, NavigationControl, ScaleControl } from "@vis.gl/react-maplibre";
import type { MapRef } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { GeometryRenderer } from "./GeometryRenderer";
import { VertexEditor } from "./VertexEditor";
import { useGeomStore } from "@/stores/geom-store";
import { bboxToLngLatBounds } from "@/utils/geo-utils";
import { Maximize2 } from "lucide-react";

const BASEMAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function MapView() {
  const mapRef = useRef<MapRef>(null);
  const geojson = useGeomStore((s) => s.geojson);
  const properties = useGeomStore((s) => s.properties);

  const fitBounds = useCallback(() => {
    if (!properties?.bbox || !mapRef.current) return;
    const bounds = bboxToLngLatBounds(properties.bbox);
    mapRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 1000,
    });
  }, [properties?.bbox]);

  useEffect(() => {
    fitBounds();
  }, [fitBounds]);

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={BASEMAP_STYLE}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />
        {geojson && <GeometryRenderer feature={geojson} />}
        {geojson && <VertexEditor />}
      </Map>

      {geojson && (
        <button
          onClick={fitBounds}
          className="absolute top-3 left-3 z-10 rounded bg-surface-1 p-1.5 text-text-secondary shadow-lg transition-colors hover:bg-surface-2 hover:text-text-primary"
          title="Fit to bounds"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
