import { useState } from "react";
import { useGeomStore } from "@/stores/geom-store";
import { FormatTab } from "./FormatTab";

type ConvertTab = "wkt" | "wkb" | "geojson" | "esrijson";

const tabs: { key: ConvertTab; label: string; language: string }[] = [
  { key: "wkt", label: "WKT", language: "plaintext" },
  { key: "wkb", label: "WKB", language: "plaintext" },
  { key: "geojson", label: "GeoJSON", language: "json" },
  { key: "esrijson", label: "EsriJSON", language: "json" },
];

export function ConversionPanel() {
  const [activeTab, setActiveTab] = useState<ConvertTab>("wkt");
  const { wkt, wkb, geojsonText, esriJson } = useGeomStore();

  const contentMap: Record<ConvertTab, string | null> = {
    wkt,
    wkb,
    geojson: geojsonText,
    esrijson: esriJson,
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-1.5 text-[10px] font-medium uppercase transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-accent text-accent"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="flex-1 overflow-hidden">
        <FormatTab
          label={tabs.find((t) => t.key === activeTab)!.label}
          content={contentMap[activeTab]}
          language={tabs.find((t) => t.key === activeTab)!.language}
        />
      </div>
    </div>
  );
}
