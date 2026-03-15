import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { MapView } from "@/components/map/MapView";
import { GeometryInput } from "@/components/input/GeometryInput";
import { ConversionPanel } from "@/components/conversion/ConversionPanel";
import { PropertiesPanel } from "@/components/properties/PropertiesPanel";
import { ProjectionPanel } from "@/components/projection/ProjectionPanel";
import { useUiStore } from "@/stores/ui-store";
import {
  TextCursorInput,
  ArrowLeftRight,
  Info,
  MapPin,
  PanelLeft,
} from "lucide-react";
import type { SidePanel } from "@/types/geometry";

const PANEL_TABS: { key: SidePanel; icon: typeof TextCursorInput; label: string }[] = [
  { key: "input", icon: TextCursorInput, label: "Input" },
  { key: "convert", icon: ArrowLeftRight, label: "Convert" },
  { key: "properties", icon: Info, label: "Properties" },
  { key: "projection", icon: MapPin, label: "Projection" },
];

const MIN_SIDEBAR_WIDTH = 280;

export function Workspace() {
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    activePanel,
    setActivePanel,
  } = useUiStore();

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startWidth: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    },
    [sidebarWidth],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth;
      const maxWidth = Math.floor(containerWidth * 0.5);
      const delta = e.clientX - resizeRef.current.startX;
      const newWidth = Math.min(
        maxWidth,
        Math.max(MIN_SIDEBAR_WIDTH, resizeRef.current.startWidth + delta),
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1">
      {/* Left sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="flex shrink-0 flex-col border-r border-border bg-surface-1"
            style={{ width: sidebarWidth }}
          >
            {/* Sidebar tabs */}
            <div className="flex shrink-0 border-b border-border">
              {PANEL_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActivePanel(tab.key)}
                    className={`flex flex-1 items-center justify-center gap-1 py-2 text-[10px] transition-colors ${
                      activePanel === tab.key
                        ? "border-b-2 border-accent text-accent"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                    title={tab.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-auto">
              {activePanel === "input" && <GeometryInput />}
              {activePanel === "convert" && <ConversionPanel />}
              {activePanel === "properties" && <PropertiesPanel />}
              {activePanel === "projection" && <ProjectionPanel />}
            </div>
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            className={`w-1 shrink-0 cursor-col-resize transition-colors hover:bg-accent/30 ${
              isResizing ? "bg-accent/30" : "bg-surface-2"
            }`}
          />
        </>
      )}

      {/* Center: Toolbar + Map */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface-1 px-2 py-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`rounded p-1 text-xs transition-colors ${
              sidebarOpen
                ? "text-accent hover:bg-surface-2"
                : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
            }`}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1">
          <ErrorBoundary fallbackLabel="Map error">
            <MapView />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
