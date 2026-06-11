import { create } from 'zustand';

interface UIState {
  isShortcutsOpen: boolean;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;
  openShortcuts: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isShortcutsOpen: false,
  toggleShortcuts: () => set((state) => ({ isShortcutsOpen: !state.isShortcutsOpen })),
  closeShortcuts: () => set({ isShortcutsOpen: false }),
  openShortcuts: () => set({ isShortcutsOpen: true }),
}));
