import { useState, useCallback } from "react";
import { useGeomStore } from "@/stores/geom-store";
import { PRESET_PROJECTIONS, getProjectionName } from "@/services/projection-service";
import { Button } from "@/components/shared/Button";

export function ProjectionPanel() {
  const { currentEpsg, setProjection, parseStatus } = useGeomStore();
  const [epsgInput, setEpsgInput] = useState(String(currentEpsg));
  const [loading, setLoading] = useState(false);

  const handleApply = useCallback(async () => {
    const code = parseInt(epsgInput, 10);
    if (isNaN(code) || code <= 0) return;

    setLoading(true);
    try {
      await setProjection(code);
    } finally {
      setLoading(false);
    }
  }, [epsgInput, setProjection]);

  const handlePreset = useCallback(
    async (epsg: number) => {
      setEpsgInput(String(epsg));
      setLoading(true);
      try {
        await setProjection(epsg);
      } finally {
        setLoading(false);
      }
    },
    [setProjection],
  );

  const isDisabled = parseStatus !== "ready";

  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <h3 className="mb-2 text-xs font-medium text-text-secondary">Projection</h3>
        <p className="text-[11px] text-text-muted">
          Current: EPSG:{currentEpsg} ({getProjectionName(currentEpsg)})
        </p>
      </div>

      {/* EPSG input */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 rounded border border-border bg-surface-2 px-2">
          <span className="text-xs text-text-muted">EPSG:</span>
          <input
            type="text"
            value={epsgInput}
            onChange={(e) => setEpsgInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
            }}
            className="w-16 bg-transparent py-1 text-xs text-text-primary focus:outline-none"
            disabled={isDisabled}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={isDisabled || loading}
          variant="primary"
          size="sm"
        >
          {loading ? "..." : "Apply"}
        </Button>
      </div>

      {/* Presets */}
      <div>
        <h4 className="mb-1.5 text-[11px] text-text-muted">Common Projections</h4>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_PROJECTIONS.map((p) => (
            <button
              key={p.epsg}
              onClick={() => handlePreset(p.epsg)}
              disabled={isDisabled || loading}
              className={`rounded px-2 py-1 text-[10px] transition-colors ${
                currentEpsg === p.epsg
                  ? "bg-accent/20 text-accent"
                  : "bg-surface-2 text-text-secondary hover:bg-surface-3"
              } disabled:opacity-50`}
            >
              {p.epsg} ({p.name})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
