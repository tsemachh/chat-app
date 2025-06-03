// This file is the main configuration file for Vite build tool (used in React projects)

// - Uses @vitejs/plugin-react for JSX transformation, HMR, and Fast Refresh
// - Exports config using defineConfig for better IntelliSense and type safety
// - Can be extended with aliasing, proxy, server options, or environment config

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], // Enables React-specific features like HMR and Babel support
});