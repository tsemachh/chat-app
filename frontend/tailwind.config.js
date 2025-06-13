// DaisyUI theme 


import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",                  
    "./src/**/*.{js,ts,jsx,tsx}",      //  frontend source files
  ],
  theme: {
    extend: {},                        // Extend default Tailwind theme
  },
  plugins: [daisyui],                  // Register DaisyUI as a plugin

  daisyui: {
    themes: [
      "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
      "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden",
      "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black",
      "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade",
      "night", "coffee", "winter", "dim", "nord", "sunset"
    ], //   DaisyUI themes 
  },
};