import { create } from "zustand";

interface DebugStore {
  logs: string[];
  addLog: (msg: string) => void;
  clear: () => void;
  openCount: number; 
  incOpen: () => void; 
  decOpen: () => void; 
}
const isDebugMode = () => (window as any).javaBridge?.isDebuggingMode?.() === true;

export const useDebugStore = create<DebugStore>((set) => ({
  logs: [],

  openCount: 0, 

  incOpen: () =>
    set((s) => ({ openCount: s.openCount + 1 })),

  decOpen: () =>
    set((s) => ({ openCount: Math.max(0, s.openCount - 1) })),

  addLog: (msg: string) => {
    if (!isDebugMode()) return;

    set((prev) => {
      if (prev.openCount > 0) return prev; 

      const time = new Date().toLocaleTimeString();
      return {
        logs: [...prev.logs.slice(-30), `${time} ${msg}`],
      };
    });
  },

  clear: () => set({ logs: [] }),
}));