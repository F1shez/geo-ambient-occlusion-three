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
import { mergeObject, copyUV1toUV2, changeVertexColor } from "./utils";
import { setUnwrapMap } from "./setUnwrapMapVertexColor";
import { RendererTextureMaker } from "./RendererTextureMaker";

export async function vertexBake(scene: Scene | Object3D) {
  const textureLoader = new TextureLoader();
  const geometries: any[] = [];
  const promises: Promise<Texture | void>[] = [];

  scene.traverse(function (child: any) {
    if (child.isMesh) {
      copyUV1toUV2(child);
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

    scene.traverse(function (child: any) {
      if (child.isMesh) {
        geometries.forEach(async (geometry) => {
          if (child.geometry === geometry) {
            console.log("find");
            const image = createTextureAO(child);
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
    console.log("finish bake vertex AO");
  } else {
    console.log("nothing to bake");
  }
}

export function computeAmbientOcclusion(
  geometry: BufferGeometry,
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

    // geometry.computeVertexNormals();
    // geometry.computeTangents();
    // geometry.normalizeNormals();
    geometry.attributes.color.needsUpdate = true;
    indent += geometry.attributes.color.count;
  });
}

function createTextureAO(mesh: any) {
  const textureMaker = new RendererTextureMaker();
  var meshTemp = mesh.clone();
  meshTemp.frustumCulled = false;
  setUnwrapMap(meshTemp);
  return textureMaker.createMap(meshTemp, 2048, 2048);
}
