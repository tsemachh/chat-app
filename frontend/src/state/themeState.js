// This file is a Zustand store for managing and persisting the selected UI theme 
import { create } from "zustand";

export const themeState = create((set) => ({
  // Initialize theme from localStorage or default to forest (daisyUI)
  theme: localStorage.getItem("chat-theme") || "forest",

  // Update theme in both state and localStorage
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));