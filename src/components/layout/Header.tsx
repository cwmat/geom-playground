import { Pentagon, Trash2 } from "lucide-react";
import { useGeomStore } from "@/stores/geom-store";
import { FormatBadge } from "@/components/input/FormatBadge";

export function Header() {
  const { parseStatus, detectedFormat, properties, clear } = useGeomStore();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface-1 px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Pentagon className="h-5 w-5 text-accent" />
          <h1 className="text-sm font-semibold tracking-tight text-text-primary">
            GeomPlayground
          </h1>
        </div>

        {parseStatus === "ready" && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <FormatBadge format={detectedFormat} />
            {properties && (
              <>
                <span className="text-text-muted">|</span>
                <span>{properties.geometryType}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {parseStatus === "ready" && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </header>
  );
}
