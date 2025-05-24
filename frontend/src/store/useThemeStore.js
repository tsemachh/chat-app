// This file is a Zustand store for managing and persisting the selected UI theme 
import { create } from "zustand";

export const useThemeStore = create((set) => ({
  // Initialize theme from localStorage or default to "coffee"
  theme: localStorage.getItem("chat-theme") || "coffee",

  // Update theme in both state and localStorage
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
