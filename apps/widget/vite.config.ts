import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Relative asset URLs so the built bundle works from any CDN path
  base: "./",
  build: {
    target: "es2018",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        // Embed loader — emitted as a stable, unhashed widget.js
        widget: resolve(__dirname, "src/index.ts"),
      },
      output: {
        format: "iife",
        entryFileNames: (chunk) =>
          chunk.name === "widget" ? "widget.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
