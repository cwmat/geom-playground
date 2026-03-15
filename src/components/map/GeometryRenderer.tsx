import { Source, Layer } from "@vis.gl/react-maplibre";
import type { FeatureCollection } from "geojson";

interface GeometryRendererProps {
  data: FeatureCollection;
}

export function GeometryRenderer({ data }: GeometryRendererProps) {
  return (
    <Source id="geom-data" type="geojson" data={data}>
      {/* Polygon fill */}
      <Layer
        id="geom-fill"
        type="fill"
        filter={["==", "$type", "Polygon"]}
        paint={{
          "fill-color": "#bd93f9",
          "fill-opacity": 0.15,
        }}
      />
      {/* Polygon outline */}
      <Layer
        id="geom-outline"
        type="line"
        filter={["==", "$type", "Polygon"]}
        paint={{
          "line-color": "#bd93f9",
          "line-width": 1.5,
        }}
      />
      {/* LineString */}
      <Layer
        id="geom-line"
        type="line"
        filter={["==", "$type", "LineString"]}
        paint={{
          "line-color": "#8be9fd",
          "line-width": 2,
        }}
      />
      {/* Point */}
      <Layer
        id="geom-point"
        type="circle"
        filter={["==", "$type", "Point"]}
        paint={{
          "circle-radius": 5,
          "circle-color": "#bd93f9",
          "circle-stroke-color": "#0d0d0d",
          "circle-stroke-width": 1,
        }}
      />
    </Source>
  );
}
