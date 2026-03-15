import type { InputFormat } from "@/types/geometry";

interface FormatBadgeProps {
  format: InputFormat;
}

const formatColors: Record<InputFormat, string> = {
  wkt: "bg-blue-500/20 text-blue-400",
  wkb: "bg-purple-500/20 text-purple-400",
  geojson: "bg-green-500/20 text-green-400",
  esrijson: "bg-orange-500/20 text-orange-400",
  unknown: "bg-surface-3 text-text-muted",
};

const formatLabels: Record<InputFormat, string> = {
  wkt: "WKT",
  wkb: "WKB",
  geojson: "GeoJSON",
  esrijson: "EsriJSON",
  unknown: "Unknown",
};

export function FormatBadge({ format }: FormatBadgeProps) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${formatColors[format]}`}
    >
      {formatLabels[format]}
    </span>
  );
}
