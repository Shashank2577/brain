import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname, "src/shell"),
  plugins: [react(), tailwindcss()],
  build: {
    outDir: resolve(__dirname, "dist/shell"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  server: {
    port: 4101,
    proxy: {
      "/_fluid-os": "http://localhost:4100",
    },
  },
});
