import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeClassId: string | null;
  installPromptEvent: Event | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveClassId: (id: string | null) => void;
  setInstallPromptEvent: (event: Event | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false, // default closed on mobile — lg:static shows it on desktop
  activeClassId: null,
  installPromptEvent: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveClassId: (activeClassId) => set({ activeClassId }),
  setInstallPromptEvent: (installPromptEvent) => set({ installPromptEvent }),
}));
