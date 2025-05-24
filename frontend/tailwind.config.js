// This file is a configuration for TailwindCSS and DaisyUI theme support

// - tailwind.config.js enables Tailwind to scan HTML and JS/TS/JSX/TSX files for class usage
// - tailwind.config.js integrates DaisyUI plugin to use component-based styling and pre-built themes
// - tailwind.config.js lists all DaisyUI themes explicitly for use in theme switching (via data-theme)

import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",                    // Vite entry HTML
    "./src/**/*.{js,ts,jsx,tsx}",      // All frontend source files
  ],
  theme: {
    extend: {},                        // Extend default Tailwind theme if needed
  },
  plugins: [daisyui],                  // Register DaisyUI as a plugin

  daisyui: {
    themes: [
      "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
      "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden",
      "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black",
      "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade",
      "night", "coffee", "winter", "dim", "nord", "sunset"
    ], // Enables all DaisyUI themes for `data-theme` switching
  },
};
