import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.PARKDEF_BASE || "./",
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      output: { manualChunks: { kaplay: ["kaplay"] } },
    },
    assetsInlineLimit: 4096,
  },
});
