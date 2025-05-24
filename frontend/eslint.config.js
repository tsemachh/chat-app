// This file uses ESLint configuration for a modern React project using flat config format

// - eslint.config.js uses ESLint's new flat config API
// - eslint.config.js applies recommended rules for JavaScript, React, and React Hooks
// - eslint.config.js enables ESLint to parse JSX and modern ECMAScript features
// - eslint.config.js disables PropTypes enforcement and strict target="_blank" rule
// - eslint.config.js adds support for React Fast Refresh during development

import js from "@eslint/js"; // ESLint's core rules
import globals from "globals"; // Global variables for browser environments
import react from "eslint-plugin-react"; // React-specific linting rules
import reactHooks from "eslint-plugin-react-hooks"; // Linting rules for React Hooks
import reactRefresh from "eslint-plugin-react-refresh"; // Prevents full reload during dev

export default [
  // Ignore build output
  { ignores: ["dist"] },

  // Apply these rules to all JS/JSX files
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020, // ECMAScript 2020 support
      globals: globals.browser, // Browser globals like window, document
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      react: { version: "18.3" }, // React version for rule compatibility
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Include default JS + React + Hooks rule sets
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      // Custom rule overrides
      "react/jsx-no-target-blank": "off", // allow target="_blank" without rel
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "react/prop-types": "off", // disable PropTypes requirement (for TS or useState validation)
    },
  },
];
