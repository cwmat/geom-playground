import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import { ClipboardPaste, X } from "lucide-react";
import { useGeomStore } from "@/stores/geom-store";
import { FormatBadge } from "./FormatBadge";

const PLACEHOLDER = `// Paste a geometry string...
//
// WKT:
// POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))
//
// GeoJSON:
// {"type":"Point","coordinates":[-73.99,40.73]}
//
// WKB (hex):
// 0101000000000000000000F03F...
//
// EsriJSON:
// {"x":-73.99,"y":40.73,"spatialReference":{"wkid":4326}}
`;

// Dracula theme definition for Monaco
const DRACULA_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "f8f8f2", background: "282a36" },
    { token: "comment", foreground: "6272a4", fontStyle: "italic" },
    { token: "string", foreground: "f1fa8c" },
    { token: "number", foreground: "bd93f9" },
    { token: "keyword", foreground: "ff79c6" },
    { token: "delimiter", foreground: "f8f8f2" },
    { token: "delimiter.bracket", foreground: "f8f8f2" },
    { token: "key", foreground: "8be9fd", fontStyle: "italic" },
    { token: "string.key.json", foreground: "8be9fd" },
    { token: "string.value.json", foreground: "f1fa8c" },
    { token: "number.json", foreground: "bd93f9" },
    { token: "keyword.json", foreground: "ff79c6" },
  ],
  colors: {
    "editor.background": "#131020",
    "editor.foreground": "#f8f8f2",
    "editor.lineHighlightBackground": "#1a1530",
    "editor.selectionBackground": "#bd93f933",
    "editor.inactiveSelectionBackground": "#bd93f920",
    "editorCursor.foreground": "#f8f8f2",
    "editorWhitespace.foreground": "#3b3a52",
    "editorLineNumber.foreground": "#6272a4",
    "editorLineNumber.activeForeground": "#f8f8f2",
    "editor.selectionHighlightBackground": "#424450",
    "editorIndentGuide.background": "#3b3a52",
    "editorIndentGuide.activeBackground": "#6272a4",
    "editorWidget.background": "#1a1530",
    "editorWidget.border": "#251d3a",
    "input.background": "#131020",
    "input.border": "#251d3a",
    "scrollbar.shadow": "#0d0d0d",
    "scrollbarSlider.background": "#241d4080",
    "scrollbarSlider.hoverBackground": "#2e2650",
    "scrollbarSlider.activeBackground": "#bd93f950",
  },
};

function detectLanguage(format: string): string {
  if (format === "geojson" || format === "esrijson") return "json";
  return "plaintext";
}

export function GeometryInput() {
  const { inputText, detectedFormat, parseStatus, parseError, geosStatus, parseInput, clear } =
    useGeomStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const text = value ?? "";
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

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme("dracula", DRACULA_THEME);
  }, []);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
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

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        {isDisabled ? (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            Initializing GEOS...
          </div>
        ) : (
          <Editor
            value={inputText || PLACEHOLDER}
            language={detectLanguage(detectedFormat)}
            theme="dracula"
            beforeMount={handleBeforeMount}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              wrappingIndent: "indent",
              automaticLayout: true,
              renderLineHighlight: "line",
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              padding: { top: 8, bottom: 8 },
              folding: false,
              glyphMargin: false,
              contextmenu: false,
            }}
          />
        )}
      </div>

      {/* Parse error */}
      {parseStatus === "error" && parseError && (
        <div className="border-t border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
          {parseError}
        </div>
      )}
    </div>
  );
}
