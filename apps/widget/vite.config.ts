import { defineConfig } from "vite";
import { resolve } from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  // Relative asset URLs so the built bundle works from any CDN path
  base: "./",
  plugins: [cssInjectedByJsPlugin()],
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
        widget: resolve(__dirname, "src/index.ts"),
      },
      output: {
        format: "iife",
        entryFileNames: "widget.js",
        inlineDynamicImports: true,
      },
    },
  },
});
