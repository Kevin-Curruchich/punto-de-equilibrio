import { create } from "zustand";

interface UIState {
  // Global loading overlay (for auth transitions)
  isGlobalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;

  // Toast
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (v) => set({ isGlobalLoading: v }),

  toast: null,
  showToast: (message, type = "info") => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}));
