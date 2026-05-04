import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("konva")) return "konva";
            if (id.includes("jspdf")) return "pdf";
            if (id.includes("i18next") || id.includes("react-i18next")) return "i18n";
            if (id.includes("react") || id.includes("scheduler")) return "react";
          }
        },
      },
    },
  },
});
