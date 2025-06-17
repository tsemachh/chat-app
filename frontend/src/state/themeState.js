import { create } from "zustand";

export const themeState = create((set) => ({
  // Initialize theme from localStorage (daisyUI)
  theme: localStorage.getItem("chat-theme") || "forest",

  // Update theme in both state and localStorage
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));