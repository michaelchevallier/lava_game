import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(process.cwd(), "src-v3"),
  base: process.env.KINGSHOT_BASE || "./",
  server: {
    port: 5174,
    host: true,
    open: false,
  },
  build: {
    outDir: resolve(process.cwd(), "dist-kingshot"),
    emptyOutDir: true,
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
      keep_classnames: true,
    },
    rollupOptions: {
      output: { manualChunks: { three: ["three"] } },
    },
    assetsInlineLimit: 4096,
  },
});
