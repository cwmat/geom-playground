import { useCallback } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { CopyButton } from "@/components/shared/CopyButton";

// Same Dracula theme - defineTheme is idempotent, safe to call again
const DRACULA_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "f8f8f2", background: "282a36" },
    { token: "comment", foreground: "6272a4", fontStyle: "italic" },
    { token: "string", foreground: "f1fa8c" },
    { token: "number", foreground: "bd93f9" },
    { token: "keyword", foreground: "ff79c6" },
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
    "editorCursor.foreground": "#f8f8f2",
    "editorLineNumber.foreground": "#6272a4",
    "editorLineNumber.activeForeground": "#f8f8f2",
    "editorWidget.background": "#1a1530",
    "scrollbarSlider.background": "#241d4080",
    "scrollbarSlider.hoverBackground": "#2e2650",
  },
};

interface FormatTabProps {
  label: string;
  content: string | null;
  language?: string;
}

export function FormatTab({ label, content, language = "plaintext" }: FormatTabProps) {
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme("dracula", DRACULA_THEME);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs text-text-muted">{label}</span>
        <CopyButton text={content} />
      </div>
      <div className="flex-1 overflow-hidden">
        {content !== null ? (
          <Editor
            value={content}
            language={language}
            theme="dracula"
            beforeMount={handleBeforeMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              wrappingIndent: "indent",
              automaticLayout: true,
              renderLineHighlight: "none",
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
              domReadOnly: true,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            No geometry loaded
          </div>
        )}
      </div>
    </div>
  );
}
