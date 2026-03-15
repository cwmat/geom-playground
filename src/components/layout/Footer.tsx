import { useGeomStore } from "@/stores/geom-store";
import { formatNumber } from "@/utils/format";

export function Footer() {
  const { geosStatus, parseStatus, parseError, properties, currentEpsg } =
    useGeomStore();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-surface-1 px-4 text-[11px] text-text-muted">
      <div className="flex items-center gap-3">
        {geosStatus === "loading" && (
          <span className="text-accent">Loading GEOS...</span>
        )}
        {geosStatus === "error" && (
          <span className="text-red-400">GEOS failed to load</span>
        )}
        {geosStatus === "ready" && parseStatus === "idle" && (
          <span className="text-accent">GEOS Ready</span>
        )}
        {parseStatus === "parsing" && (
          <span className="text-accent">Parsing...</span>
        )}
        {parseStatus === "error" && (
          <span className="text-red-400">{parseError || "Error"}</span>
        )}
        {parseStatus === "ready" && properties && (
          <>
            <span>{properties.geometryType}</span>
            <span>{formatNumber(properties.vertexCount)} vertices</span>
            <span>EPSG:{currentEpsg}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>Client-side only</span>
        <span className="text-text-muted/50">|</span>
        <span>Your data stays local</span>
      </div>
    </footer>
  );
}
