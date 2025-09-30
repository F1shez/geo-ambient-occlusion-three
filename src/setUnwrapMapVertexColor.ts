import { ShaderMaterial, DoubleSide } from "three";

function vertexShader() {
  return `
    varying vec2 vUv;
    varying vec3 fNormal;
    varying vec3 vColor;

    void main() {
        vColor = color;
        vUv = uv;
        fNormal = normal;
        vec3 newPosition = vec3(uv.xy*2.0-1.0, 0.0);
        newPosition.y *= -1.0;
        newPosition.y += 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
    }
  `;
}

function fragmentShader() {
  return `
        varying vec2 vUv;
        varying vec3 vColor;

        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }
  `;
}

function setUnwrapMap(mesh: any) {
  let uniforms = {};

  let material = new ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader(),
    vertexShader: vertexShader(),
    side: DoubleSide,
    vertexColors: true,
  });

  mesh.material = material;
}
export { setUnwrapMap };
