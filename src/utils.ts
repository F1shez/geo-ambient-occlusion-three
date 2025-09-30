import { BufferAttribute, Color, Object3D, type Mesh } from "three";
import { GLTFExporter } from "three/examples/jsm/Addons.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RendererTextureMaker } from "./RendererTextureMaker";
import { setUnwrapMap } from "./setUnwrapMapVertexColor";

export function mergeObject(geometries: any[]) {
  geometries.forEach((element) => {
    element.setAttribute("uv2", element.getAttribute("uv"));
  });
  return mergeGeometries(geometries, true);
}

export function copyUV1toUV2(mesh: Mesh) {
  if (mesh.geometry.getAttribute("uv")) {
    var uvs = mesh.geometry.attributes.uv.array;
    mesh.geometry.setAttribute("uv2", new BufferAttribute(uvs, 2));
    mesh.geometry.setAttribute("uv1", new BufferAttribute(uvs, 2));
  }
}

export function changeVertexColor(mesh: Mesh, color: Color) {
  const count = mesh.geometry.attributes.position.count;
  const colors = mesh.geometry.attributes.color;
  if (colors && count) {
    for (let i = 0; i < count; i++) {
      colors.setXYZ(i, color.r, color.g, color.b);
    }
  }
}

export async function exportGltf(scene: Object3D) {
  const exporter = new GLTFExporter();
  const buffer = (await exporter.parseAsync(scene, {
    binary: true,
  })) as ArrayBuffer;

  const blob = new Blob([buffer], { type: "model/gltf-binary" });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "scene.glb";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release memory held by the object URL
  URL.revokeObjectURL(url);
}

export function bakeTextureFromMesh(mesh: Mesh, height = 1024, width = 1024) {
  const textureMaker = new RendererTextureMaker();
  var meshTemp = mesh.clone();
  meshTemp.frustumCulled = false;
  setUnwrapMap(meshTemp);
  return textureMaker.createMap(meshTemp, height, width);
}
