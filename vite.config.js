// Vite config — pure React + Vite, proxying /api/* to the FastAPI backend
// during dev. The base44 SDK plugin is no longer used (we have our own
// HTTP client in src/api/apiClient.js).

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_TARGET = process.env.VITE_API_URL || "http://127.0.0.1:8000";

export default defineConfig({
  logLevel: "error",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5174,
    host: "127.0.0.1",
    proxy: {
      // Forward any /api/* requests straight to FastAPI during dev.
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [react()],
});
