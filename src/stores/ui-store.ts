import { create } from "zustand";
import type { SidePanel } from "@/types/geometry";

interface UiStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  activePanel: SidePanel;
  setActivePanel: (panel: SidePanel) => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  activePanel: "input",
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
