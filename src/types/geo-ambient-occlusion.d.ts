// src/types/geo-ambient-occlusion.d.ts
declare module "geo-ambient-occlusion" {
  import { REGL } from "regl";

  interface GeoAmbientOcclusionOptions {
    cells?: TypedArray;
    regl?: REGL.Regl;
    bias?: number;
    resolution?: number;
    normals?: TypedArray;
  }

  interface GeoAO {
    sample(): void;
    report(): Float32Array;
    dispose(): void;
  }

  function geoAO(
    positions: TypedArray,
    opts?: GeoAmbientOcclusionOptions,
  ): GeoAO;

  export default geoAO;
}
