import { useGeomStore } from "@/stores/geom-store";
import { formatNumber, formatCoord, formatArea, formatLength } from "@/utils/format";

function PropertyRow({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-right font-mono text-xs text-text-primary">{value}</span>
    </div>
  );
}

export function PropertiesPanel() {
  const { properties, currentEpsg } = useGeomStore();

  if (!properties) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <span className="text-xs text-text-muted">No geometry loaded</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-auto p-3">
      <h3 className="mb-2 text-xs font-medium text-text-secondary">Properties</h3>
      <div className="divide-y divide-border">
        <PropertyRow label="Type" value={properties.geometryType} />
        <PropertyRow label="Vertices" value={formatNumber(properties.vertexCount)} />
        <PropertyRow
          label="Area"
          value={properties.area !== null ? formatArea(properties.area) : null}
        />
        <PropertyRow
          label="Length"
          value={properties.length !== null ? formatLength(properties.length) : null}
        />
        <PropertyRow
          label="Centroid"
          value={
            properties.centroid
              ? `${formatCoord(properties.centroid[0])}, ${formatCoord(properties.centroid[1])}`
              : null
          }
        />
        <PropertyRow
          label="BBox"
          value={
            properties.bbox
              ? `${formatCoord(properties.bbox[0])}, ${formatCoord(properties.bbox[1])}, ${formatCoord(properties.bbox[2])}, ${formatCoord(properties.bbox[3])}`
              : null
          }
        />
        <PropertyRow label="CRS" value={`EPSG:${currentEpsg}`} />
      </div>
    </div>
  );
}
