import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Relative asset URLs so the built bundle works from any versioned CDN path
  // (e.g. https://cdn.parrot.app/v0.1.0/ or /latest/) without rebuilding per-version.
  base: "./",
  server: {
    port: 5173,
    open: "/index.html",
  },
  build: {
    target: "es2018",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        // Embed loader — exposes window.Parrot. Emitted as a stable, unhashed
        // parrot.js so the public CDN URL is predictable.
        parrot: resolve(__dirname, "src/parrot.ts"),
        // Sandboxed chat UI, hosted on the CDN and loaded as the iframe src.
        embed: resolve(__dirname, "src/embed/embed.html"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "parrot" ? "parrot.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
