import { BufferAttribute, Color, type Mesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

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
