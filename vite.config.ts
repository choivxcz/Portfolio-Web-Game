import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base: "./"` makes every asset path relative, so the same build works at
// https://<user>.github.io/ AND at https://<user>.github.io/<repo>/ without changes.
// (The site is a single page with hash anchors, so no router base is needed.)
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    // The 3D engine (three.js + the world) is deliberately one lazy-loaded chunk
    // (~400 kB gzipped) that downloads after the interface and loading screen appear.
    chunkSizeWarningLimit: 1400,
  },
});
