import { create } from "zustand";
import type { SidePanel } from "@/types/geometry";

interface UiStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  activePanel: SidePanel;
  setActivePanel: (panel: SidePanel) => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  sidebarWidth: 420,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  activePanel: "input",
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
