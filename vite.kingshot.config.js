import { defineConfig } from "vite";
import { resolve } from "path";

const _now = new Date();
const _pad = (n) => String(n).padStart(2, "0");
const BUILD_VERSION = `${_now.getUTCFullYear()}${_pad(_now.getUTCMonth() + 1)}${_pad(_now.getUTCDate())}.${_pad(_now.getUTCHours())}${_pad(_now.getUTCMinutes())}`;

export default defineConfig({
  root: resolve(process.cwd(), "src-v3"),
  base: process.env.KINGSHOT_BASE || "./",
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  server: {
    port: 5174,
    host: true,
    open: false,
  },
  preview: {
    port: 4174,
    strictPort: true,
    host: true,
  },
  build: {
    outDir: resolve(process.cwd(), "dist-kingshot"),
    emptyOutDir: true,
    target: "es2022",
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
