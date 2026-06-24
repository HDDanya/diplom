import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  envDir: "..",
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          mantine: ["@mantine/core", "@mantine/hooks", "@mantine/notifications"],
          data: ["@tanstack/react-query", "axios"],
          motion: ["framer-motion"]
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
});
