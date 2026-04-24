import { create } from 'zustand';

interface UIState {
  isCommandPaletteOpen: boolean;
  isSidebarOpen: boolean;
  activeSeasonId: string | null;
  
  // Actions
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveSeasonId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  isSidebarOpen: false,
  activeSeasonId: null,

  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveSeasonId: (id) => set({ activeSeasonId: id }),
}));
