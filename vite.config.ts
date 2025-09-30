import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GeoAmbientOcclusionThree",
      fileName: (format) => `geo-ambient-occlusion-three.${format}.js`,
    },
    rollupOptions: {
      external: ["three"],
    },
  },
  plugins: [dts()],
});
