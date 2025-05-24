// This file configuration file for PostCSS used by TailwindCSS and Autoprefixer

// - postcss.config.js enables TailwindCSS for utility-first styling
// - postcss.config.js uses Autoprefixer to automatically add vendor prefixes for CSS compatibility
// - postcss.config.js this config is used by Vite during development and build

export default {
  plugins: {
    tailwindcss: {},   // Enables TailwindCSS processing
    autoprefixer: {},  // Adds vendor prefixes to CSS for cross-browser support
  },
};
