declare module "@terraformer/arcgis" {
  export function arcgisToGeoJSON(arcgis: unknown): GeoJSON.GeoJsonObject;
  export function geojsonToArcGIS(geojson: unknown): unknown;
}
