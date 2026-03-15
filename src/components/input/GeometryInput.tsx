import { useRef, useCallback, useEffect } from "react";
import { ClipboardPaste, X } from "lucide-react";
import { useGeomStore } from "@/stores/geom-store";
import { FormatBadge } from "./FormatBadge";

const PLACEHOLDER = `Paste a geometry string...

WKT:
POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))

GeoJSON:
{"type":"Point","coordinates":[-73.99,40.73]}

WKB (hex):
0101000000000000000000F03F...

EsriJSON:
{"x":-73.99,"y":40.73,"spatialReference":{"wkid":4326}}`;

export function GeometryInput() {
  const { inputText, detectedFormat, parseStatus, parseError, geosStatus, parseInput, clear } =
    useGeomStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      // Update text immediately for responsive typing
      useGeomStore.setState({ inputText: text });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        parseInput(text);
      }, 300);
    },
    [parseInput],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        useGeomStore.setState({ inputText: text });
        parseInput(text);
      }
    } catch {
      console.warn("Failed to read clipboard");
    }
  }, [parseInput]);

  const isDisabled = geosStatus !== "ready";

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Input</span>
          {inputText && <FormatBadge format={detectedFormat} />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePaste}
            disabled={isDisabled}
            className="rounded p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-50"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
          </button>
          {inputText && (
            <button
              onClick={clear}
              className="rounded p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              title="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={inputText}
        onChange={handleChange}
        disabled={isDisabled}
        placeholder={isDisabled ? "Initializing GEOS..." : PLACEHOLDER}
        className="flex-1 resize-none bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-text-primary placeholder-text-muted/50 focus:outline-none disabled:opacity-50"
        spellCheck={false}
      />

      {/* Parse error */}
      {parseStatus === "error" && parseError && (
        <div className="border-t border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
          {parseError}
        </div>
      )}
    </div>
  );
}
