import geoAO from "geo-ambient-occlusion";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Object3D,
  RepeatWrapping,
  Texture,
  TextureLoader,
  type Scene,
} from "three";
import {
  mergeObject,
  copyUV1toUV2,
  changeVertexColor,
  bakeTextureFromMesh,
} from "./utils";

interface AOOptions {
  bakeTexture: boolean;
  resolution?: number;
}

/**
 * Computes per‑vertex ambient occlusion (AO) for all opaque meshes in a scene or object,
 * optionally baking the AO into an AO texture.
 *
 * The function walks through the supplied {@link Scene | Scene} or {@link Object3D | Object3D},
 * collects geometries of non‑transparent meshes, merges them and computes vertex‑based
 * ambient occlusion.  It then writes the resulting AO values back to each geometry’s
 * `vertexColors` attribute.
 *
 * When {@link AOOptions.bakeTexture} is true, it also generates an AO texture for each mesh,
 * loads it asynchronously via {@link TextureLoader}, and assigns the texture to the mesh's
 * material (`aoMap`).  The textures are configured with {@link RepeatWrapping} and have
 * `flipY` disabled so they map correctly.
 *
 * @param {Scene | Object3D} scene - The Three.js object whose meshes will be processed.
 * @param {AOOptions} opts - Options controlling the AO computation, including:
 *   - `bakeTexture`: whether to generate and assign AO textures,
 *   - `resolution`: resolution of the generated texture(s).
 *
 * @returns {Promise<void>} Resolves when all geometry merging, AO calculation, and
 *   optional texture baking are complete.
 */
export async function vertexBake(scene: Scene | Object3D, opts?: AOOptions) {
  const textureLoader = new TextureLoader();
  const geometries: any[] = [];
  const promises: Promise<Texture | void>[] = [];

  scene.traverse(function (child: any) {
    if (child.isMesh) {
      copyUV1toUV2(child); //need if not have uv2
      if (!child.material.transparent && child.material.alphaTest === 0) {
        geometries.push(child.geometry);
      }
    }
  });

  let mergedGeometry = null;
  if (geometries.length === 1) {
    mergedGeometry = geometries[0];
  }
  mergedGeometry = mergeObject(geometries);

  if (mergedGeometry) {
    const ao = computeAmbientOcclusion(mergedGeometry);
    setVertexAO(geometries, ao);

    if (opts && opts.bakeTexture) {
      scene.traverse(function (child: any) {
        if (child.isMesh) {
          geometries.forEach(async (geometry) => {
            if (child.geometry === geometry) {
              console.log("find");
              const image = bakeTextureFromMesh(
                child,
                opts.resolution,
                opts.resolution
              );
              const promise = textureLoader.loadAsync(image);
              promises.push(promise);
              const newAoMap = (await promise) as Texture;
              newAoMap.flipY = false;
              newAoMap.wrapS = RepeatWrapping;
              newAoMap.wrapT = RepeatWrapping;
              child.material.aoMap = newAoMap;
              child.material.aoMapIntensity = 0.8;
              changeVertexColor(child, new Color(1, 1, 1));
              child.material.vertexColors = false;
              child.material.needsUpdate = true;
            }
          });
        }
      });
      await Promise.all(promises);
    }
    console.log("finish bake vertex AO");
  } else {
    console.log("nothing to bake");
  }
}

/**
 * Computes per‑vertex ambient occlusion (AO) values for a {@link BufferGeometry}.
 *
 * @param geometry - The geometry whose vertices will receive AO information.
 *
 * The algorithm uses the `geoAO` library to sample occlusion around each vertex:
 *   1. If the geometry has an index, it builds an array of face indices (`cellsArray`)
 *      and passes it to `geoAO`.
 *   2. Otherwise it calls `geoAO` with just positions and normals.
 *   3. It runs 1024 AO samples per vertex (the default resolution for `geoAO`).
 *
 * @returns A {@link Float32Array} containing one AO value per vertex in the
 *          original geometry’s order. The returned array can be used to set
 *          vertex colors, or as an auxiliary texture.
 */
export function computeAmbientOcclusion(
  geometry: BufferGeometry
): Float32Array {
  const index = geometry.getIndex();

  let aoSampler;

  if (index) {
    const cellsArray = [];

    for (let i = 0; i < index.count; i += 3) {
      const vector = [];
      vector.push(index.getX(i));
      vector.push(index.getX(i + 1));
      vector.push(index.getX(i + 2));
      cellsArray.push(vector);
    }
    aoSampler = geoAO(geometry.attributes.position.array, {
      cells: cellsArray,
      resolution: 1024,
      normals: geometry.attributes.normal.array,
      bias: 0.06,
    });
  } else {
    aoSampler = geoAO(geometry.attributes.position.array, {
      resolution: 1024,
      normals: geometry.attributes.normal.array,
      bias: 0.06,
    });
  }

  for (let i = 0; i < 1024; i++) {
    aoSampler.sample();
  }

  const ao = aoSampler.report();

  aoSampler.dispose();

  return ao;
}

function setVertexAO(geometries: any, ao: any) {
  let indent = 0;
  geometries.forEach((geometry: any) => {
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    if (colors && count) {
      for (let i = 0; i < count; i++) {
        const c = 1 - ao[i + indent];
        colors.set([c, c, c], i * 3);
      }
    }

    geometry.setAttribute("color", new BufferAttribute(colors, 3));

    geometry.attributes.color.needsUpdate = true;
    indent += geometry.attributes.color.count;
  });
}
