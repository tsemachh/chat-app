import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: {}, // Required to trick some libraries into thinking "global" exists
  },
  resolve: {
    alias: {
      buffer: "buffer",
      process: "process/browser",
    },
  },
});
